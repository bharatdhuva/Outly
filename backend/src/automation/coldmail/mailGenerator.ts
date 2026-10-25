import { logger } from "../../lib/logger.js";
import { companyQueries } from "../../db/queries.js";
import { generateColdEmailChain } from "../../ai/coldMailChain.js";

export interface GeneratedMail {
  subject: string;
  body: string;
  personalization_hook: string;
  variants?: any;
  followups?: any;
}

/**
 * Generates cold email for a company using the upgraded LangChain ColdMailChain.
 */
export async function generateMailForCompany(
  companyId: string,
  provider: "gemini" | "grok" | "openrouter" = "gemini",
  modelName: string = "gemini-2.5-flash",
): Promise<GeneratedMail | null> {
  logger.info(`[MailGenerator] Generating mail for company ID: ${companyId} using LangChain...`);

  try {
    const company = await companyQueries.getById(companyId);
    if (!company) {
      logger.error(`[MailGenerator] Company with ID ${companyId} not found`);
      return null;
    }

    // Parse scraped context if available
    let scrapedContextData: any = company.scraped_context;
    if (typeof company.scraped_context === "string" && company.scraped_context.trim()) {
      try {
        scrapedContextData = JSON.parse(company.scraped_context);
      } catch {
        scrapedContextData = company.scraped_context;
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
      keySkills: company.key_skills || undefined,
      experienceLevel: company.experience_level || undefined,
      senderName: company.sender_name || undefined,
      senderLocation: company.sender_location || undefined,
      personalizationHook: company.personalization_hook || undefined,
      scrapedContext: scrapedContextData,
      modelName: modelName,
    });

    if (aiResult && aiResult.subject && aiResult.body) {
      // Save generated email and A/B variants into database
      await companyQueries.update(companyId, {
        generated_subject: aiResult.subject,
        generated_mail: aiResult.body,
        personalization_hook: aiResult.personalization_hook,
        generated_variants_json: aiResult.variants ? JSON.stringify(aiResult.variants) : null,
        status: "mail_generated",
      });

      return {
        subject: aiResult.subject,
        body: aiResult.body,
        personalization_hook: aiResult.personalization_hook,
        variants: aiResult.variants,
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

    const recipientName = company.target_person_name || "Hiring Team";
    const companyName = company.company_name || "your team";
    const role = company.role || "Software Engineer";
    const skills = company.key_skills || "React, Node.js, Express, MongoDB";
    const sender = company.sender_name || "Candidate";
    const hook = company.personalization_hook || `I've been closely following ${companyName}'s work and tech initiatives.`;

    const subject = `Application for ${role} - ${sender}`;
    const body = `Hi ${recipientName},\n\n${hook}\n\nI am writing to express my strong interest in the ${role} position at ${companyName}. With hands-on experience in ${skills}, I specialize in building scalable web applications and delivering clean, efficient software.\n\nI would love the opportunity to discuss how my background aligns with your engineering goals. Please let me know if you are open to a quick chat this week.\n\nBest regards,\n${sender}`;

    await companyQueries.update(companyId, {
      generated_subject: subject,
      generated_mail: body,
      personalization_hook: hook,
      status: "mail_generated",
    });

    return {
      subject,
      body,
      personalization_hook: hook,
    };
  } catch (err: any) {
    logger.error(`[MailGenerator] Dynamic mail generator fallback failed: ${err?.message || err}`);
    return null;
  }
}
