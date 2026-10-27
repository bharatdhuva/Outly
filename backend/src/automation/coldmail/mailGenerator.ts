import { logger } from "../../lib/logger.js";
import { companyQueries } from "../../db/queries.js";
import { generateColdEmailChain } from "../../ai/coldMailChain.js";
import { scrapeCompany } from "./companyScraper.js";
import { User } from "../../db/models.js";
import { getEditableSettings } from "../../config/appSettings.js";

export interface GeneratedMail {
  subject: string;
  body: string;
  personalization_hook: string;
  variants?: any;
  followups?: any;
}

// Track in-flight generations to prevent concurrent duplicate generation runs
const inProgressGenerations = new Map<string, Promise<GeneratedMail | null>>();

/**
 * Generates cold email for a company using the upgraded LangChain ColdMailChain.
 */
export async function generateMailForCompany(
  companyId: string,
  provider: "gemini" | "grok" | "openrouter" = "gemini",
  modelName: string = "gemini-3.5-flash",
): Promise<GeneratedMail | null> {
  if (inProgressGenerations.has(companyId)) {
    logger.info(`[MailGenerator] Generation already in progress for company ${companyId}. Awaiting active promise...`);
    return inProgressGenerations.get(companyId)!;
  }

  const task = (async (): Promise<GeneratedMail | null> => {
    logger.info(`[MailGenerator] Generating mail for company ID: ${companyId} using LangChain...`);

    try {
      let company = await companyQueries.getById(companyId);
      if (!company) {
        logger.error(`[MailGenerator] Company with ID ${companyId} not found`);
        return null;
      }

      // Check if scraped context is present and has meaningful company intelligence
      let scrapedContextData: any = company.scraped_context;
      let hasRichContext = false;

      if (typeof scrapedContextData === "string" && scrapedContextData.trim()) {
        try {
          const parsed = JSON.parse(scrapedContextData);
          if (
            parsed &&
            ((typeof parsed.description === "string" && parsed.description.trim().length > 30) ||
              (Array.isArray(parsed.techStack) && parsed.techStack.length > 0) ||
              (Array.isArray(parsed.recentNews) && parsed.recentNews.length > 0) ||
              (Array.isArray(parsed.pageHighlights) && parsed.pageHighlights.length > 0))
          ) {
            hasRichContext = true;
            scrapedContextData = parsed;
          }
        } catch {
          if (scrapedContextData.trim().length > 50) {
            hasRichContext = true;
          }
        }
      } else if (scrapedContextData && typeof scrapedContextData === "object") {
        if (
          (typeof scrapedContextData.description === "string" && scrapedContextData.description.trim().length > 30) ||
          (Array.isArray(scrapedContextData.techStack) && scrapedContextData.techStack.length > 0) ||
          (Array.isArray(scrapedContextData.recentNews) && scrapedContextData.recentNews.length > 0)
        ) {
          hasRichContext = true;
        }
      }

      // If context is missing, empty, or dummy, automatically research and scrape the company first!
      if (!hasRichContext) {
        logger.info(`[MailGenerator] Company ${company.company_name} is missing rich intelligence. Running research/scraper now...`);
        await scrapeCompany(companyId);
        const reloadedCompany = await companyQueries.getById(companyId);
        if (reloadedCompany) {
          company = reloadedCompany;
          if (reloadedCompany.scraped_context) {
            try {
              scrapedContextData = JSON.parse(reloadedCompany.scraped_context);
            } catch {
              scrapedContextData = reloadedCompany.scraped_context;
            }
          }
        }
      }

      // Dynamically resolve sender name, location, skills, and experience from user profile if not on lead
      let senderName = company.sender_name?.trim();
      let senderLocation = company.sender_location?.trim();
      let keySkills = company.key_skills?.trim();
      let experienceLevel = company.experience_level?.trim();

      const userId = (company as any).userId || (company as any).user_id;
      if (userId) {
        try {
          const userObj = await User.findById(userId);
          const userSettings = await getEditableSettings(String(userId));
          if (!senderName) {
            senderName = userSettings?.full_name?.trim() || userObj?.fullName?.trim() || "";
          }
          if (!senderLocation) {
            senderLocation = userSettings?.target_cities ? userSettings.target_cities.split(",")[0]?.trim() : "";
          }
          if (!keySkills) {
            keySkills = userSettings?.skills?.trim() || "";
          }
          if (!experienceLevel) {
            experienceLevel = userSettings?.experience?.trim() || "";
          }
        } catch (profileErr) {
          logger.warn(`[MailGenerator] Failed to load user profile for company: ${profileErr}`);
        }
      }

      // Call LangChain Cold Mail RAG Chain
      const aiResult = await generateColdEmailChain({
        companyId: (company as any).id || (company as any)._id?.toString() || companyId,
        companyName: company.company_name,
        targetRole: company.role,
        websiteUrl: company.website_url || undefined,
        targetPerson: company.target_person_name || undefined,
        targetPersonRole: company.target_person_role || undefined,
        keySkills: keySkills || company.key_skills || undefined,
        experienceLevel: experienceLevel || company.experience_level || undefined,
        senderName: senderName || undefined,
        senderLocation: senderLocation || undefined,
        personalizationHook: company.personalization_hook || undefined,
        scrapedContext: scrapedContextData,
        modelName: modelName,
      });

      if (aiResult && aiResult.subject && aiResult.body) {
        const allVariants = [
          {
            id: "primary",
            variant_name: "Option 1: Recommended",
            subject: aiResult.subject,
            body: aiResult.body,
            angle: "Balanced, high-conversion value proposition tailored directly to company profile.",
          },
          ...(Array.isArray(aiResult.variants)
            ? aiResult.variants.map((v, i) => ({
                id: `variant_${i + 1}`,
                variant_name: v.variant_name || `Option ${i + 2}`,
                subject: v.subject,
                body: v.body,
                angle: v.angle || "",
              }))
            : []),
        ];

        const variantsPayload = {
          variants: allVariants,
          followups: (aiResult as any).followups || null,
        };

        // Save generated email and all options into database
        await companyQueries.update(companyId, {
          generated_subject: aiResult.subject,
          generated_mail: aiResult.body,
          personalization_hook: aiResult.personalization_hook,
          generated_variants_json: JSON.stringify(variantsPayload),
          sender_name: senderName || company.sender_name || null,
          sender_location: senderLocation || company.sender_location || null,
          status: "mail_generated",
        });

        return {
          subject: aiResult.subject,
          body: aiResult.body,
          personalization_hook: aiResult.personalization_hook,
          variants: allVariants,
        };
      }
    } catch (error: any) {
      logger.warn(`[MailGenerator] LangChain ColdMailChain encountered error: ${error?.message || error}`);
    }

    // Fallback to legacy private module if present
    try {
      // @ts-ignore
      const privateModule = await import("./mailGenerator.private.js");
      const result = await privateModule.generateMailForCompany(companyId, provider, modelName);
      if (result && result.subject && result.body) {
        return result;
      }
    } catch (error: any) {
      logger.warn(`[MailGenerator] Legacy private module fallback note: ${error?.message || error}`);
    }

    // Final fallback dynamic generator
    try {
      const company = await companyQueries.getById(companyId);
      if (!company) return null;

      let fallbackSender = company.sender_name?.trim();
      const userId = (company as any).userId || (company as any).user_id;
      if (!fallbackSender && userId) {
        try {
          const userObj = await User.findById(userId);
          const userSettings = await getEditableSettings(String(userId));
          fallbackSender = userSettings?.full_name?.trim() || userObj?.fullName?.trim() || "";
        } catch {
          // ignore
        }
      }
      fallbackSender = fallbackSender || "Applicant";

      const recipientName = company.target_person_name || "Hiring Team";
      const companyName = company.company_name || "your team";
      const role = company.role || "Software Engineer";
      const skills = company.key_skills || "React, Node.js, Express, MongoDB";
      const hook = company.personalization_hook || `I've been closely following ${companyName}'s work and tech initiatives.`;

      const subject = `Application for ${role} - ${fallbackSender}`;
      const body = `Hi ${recipientName},\n\n${hook}\n\nI am writing to express my strong interest in the ${role} position at ${companyName}. With hands-on experience in ${skills}, I specialize in building scalable web applications and delivering clean, efficient software.\n\nI would love the opportunity to discuss how my background aligns with your engineering goals. Please let me know if you are open to a quick chat this week.\n\nBest regards,\n${fallbackSender}`;

      const fallbackVariants = [
        {
          id: "primary",
          variant_name: "Option 1: Recommended",
          subject,
          body,
          angle: "Direct interest and core skill alignment.",
        },
      ];

      await companyQueries.update(companyId, {
        generated_subject: subject,
        generated_mail: body,
        personalization_hook: hook,
        generated_variants_json: JSON.stringify({ variants: fallbackVariants }),
        sender_name: fallbackSender,
        status: "mail_generated",
      });

      return {
        subject,
        body,
        personalization_hook: hook,
        variants: fallbackVariants,
      };
    } catch (err: any) {
      logger.error(`[MailGenerator] Dynamic mail generator fallback failed: ${err?.message || err}`);
      return null;
    }
  })();

  inProgressGenerations.set(companyId, task);
  try {
    return await task;
  } finally {
    inProgressGenerations.delete(companyId);
  }
}
