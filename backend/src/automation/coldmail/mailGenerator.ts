// Remove repeated paragraphs from a draft body
function deduplicateParagraphs(body: string): string {
  const seen = new Set<string>();
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !seen.has(p) && seen.add(p))
    .join('\n\n');
}
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { companyQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coldMailGuidePathCandidates = [
  path.resolve(process.cwd(), "docs", "coldmail-format.md"),
  path.resolve(__dirname, "..", "..", "..", "docs", "coldmail-format.md"),
  path.resolve(__dirname, "..", "..", "..", "..", "docs", "coldmail-format.md"),
];
const coldMailGuidePath =
  coldMailGuidePathCandidates.find((candidate) => fs.existsSync(candidate)) ?? coldMailGuidePathCandidates[0];
const coldMailGuide = fs.existsSync(coldMailGuidePath)
  ? fs.readFileSync(coldMailGuidePath, "utf8")
  : "";

function uniqueStrings(values: Array<string | undefined | null>, limit = 12): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value?.replace(/\s+/g, " ").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= limit) break;
  }

  return result;
}

function buildResearchSection(scrapedCtx: Record<string, any>, hook: string): string {
  const sections: string[] = [];

  if (hook) {
    sections.push(`USER'S PERSONALIZATION HOOK:\n- ${hook}`);
  }
  if (scrapedCtx.description) {
    sections.push(`COMPANY WEBSITE SUMMARY:\n${String(scrapedCtx.description).slice(0, 1400)}`);
  }
  if (scrapedCtx.pageHighlights?.length) {
    sections.push(
      "WEBSITE HIGHLIGHTS:\n" +
        scrapedCtx.pageHighlights.map((item: string) => `- ${item}`).join("\n"),
    );
  }
  if (scrapedCtx.recentNews?.length) {
    sections.push(
      "LATEST NEWS / UPDATES:\n" +
        scrapedCtx.recentNews.map((item: string) => `- ${item}`).join("\n"),
    );
  }
  if (scrapedCtx.socialSignals?.length) {
    sections.push(
      "SOCIAL PLATFORM SIGNALS:\n" +
        scrapedCtx.socialSignals.map((item: string) => `- ${item}`).join("\n"),
    );
  }
  if (scrapedCtx.socialLinks?.length) {
    sections.push(
      "SOCIAL LINKS FOUND:\n" +
        scrapedCtx.socialLinks.map((item: { platform: string; url: string }) => `- ${item.platform}: ${item.url}`).join("\n"),
    );
  }
  if (scrapedCtx.techStack?.length) {
    sections.push(`TECH / PRODUCT SIGNALS:\n- ${scrapedCtx.techStack.join(", ")}`);
  }
  if (scrapedCtx.hookCandidates?.length) {
    sections.push(
      "BEST HOOK CANDIDATES:\n" +
        scrapedCtx.hookCandidates.map((item: string) => `- ${item}`).join("\n"),
    );
  }

  return sections.length > 0
    ? sections.join("\n\n")
    : "No external research found. Use only company name, role, and any user-provided hook without inventing details.";
}

function extractJson(raw: string): GeneratedMail {
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as GeneratedMail;
}

function ensureParagraphBreaks(body: string): string {
  return body.replace(/\r\n/g, "\n").trim();
}


function validateDraft(parsed: Partial<GeneratedMail>, companyName: string): GeneratedMail {
  if (!parsed.subject || !parsed.body) {
    throw new Error("AI model returned incomplete response missing subject or body");
  }

  const subject = parsed.subject.trim();
  const body = deduplicateParagraphs(parsed.body.trim());
  const hook = (parsed.personalization_hook || "").trim();

  if (subject.length < 3) {
    throw new Error("Generated subject is too short");
  }
  if (body.length < 30) {
    throw new Error("Generated email body is too short");
  }

  return {
    subject,
    body,
    personalization_hook: hook || `Personalized email for ${companyName}`,
  };
}

export async function generateMailForCompany(
  companyId: string,
  provider: "gemini" | "grok" | "openrouter" = "gemini",
  modelName: string = "gemini-2.5-flash",
): Promise<GeneratedMail | null> {
  const company = await companyQueries.getById(companyId);
  if (!company) return null;

  if (company.status === "pending") {
    logger.info(`Auto-scraping ${company.company_name} before generation...`, { source: "coldmail" });
    await scrapeCompany(companyId);
  }

  const c = (await companyQueries.getById(companyId))!;
  const scrapedCtx = c.scraped_context ? (JSON.parse(c.scraped_context) as Record<string, any>) : {};

  // Dynamically load logged-in user's profile and settings
  let userObj: any = null;
  let userSettings: any = null;
  if ((c as any).userId) {
    userObj = await User.findById((c as any).userId);
    userSettings = await getEditableSettings(String((c as any).userId));
  }

  const senderName = c.sender_name || userSettings?.full_name || userObj?.fullName || "Applicant";
  const senderLoc = c.sender_location || (userSettings?.target_cities ? userSettings.target_cities.split(",")[0]?.trim() : "") || "";
  const senderPhone = userSettings?.phone || "";
  const experience = c.experience_level || userSettings?.experience || userSettings?.target_roles || "Software Engineer";
  const skills = c.key_skills || userSettings?.skills || "React, TypeScript, Node.js";
  const targetName = c.target_person_name || `${c.company_name} Team`;
  const targetRole = c.target_person_role || "Hiring Team";
  const companyName = c.company_name;
  const roleApplying = c.role || "Software Developer Intern";
  const hook = c.personalization_hook || "";

  const researchSection = buildResearchSection(scrapedCtx, hook);

  const prompt = `You are an elite executive career strategist writing a highly personalized internship cold email for ${senderName}.

COMPREHENSIVE COMPANY RESEARCH ANALYSIS:
Carefully synthesize and integrate all company research context, website highlights, tech stacks, and social signals below:
${researchSection}

TARGET CANDIDATE & RECIPIENT PROFILE:
- Target Company: ${companyName}
- Target Recipient: ${targetName} (${targetRole})
- Role Applying For: ${roleApplying}
- Sender Name: ${senderName}
- Sender Location: ${senderLoc}
- Candidate Background & Skills: ${experience}, ${skills}

INSTRUCTIONS & QUALITY REQUIREMENTS:
1. Deep Research Integration: Analyze the company research context above. Craft a high-impact, genuine 1-line personalization hook that references specific products, tech stack, or updates of ${companyName}.
2. Generate 3 unique email variants ("formal", "casual", "short") and 2 follow-up sequences ("day4", "day7").
3. Each email body must feel authentic, human-written, concise, and compelling without generic fluff.
4. Body Structure Guidelines:
   - Address ${targetName} directly.
   - Weave in company-specific research seamlessly.
   - State interest in ${roleApplying}.
   - Include resume reference ("I’ve attached my resume for your reference.").
   - Include CTA ("Would you be open to a quick 10-minute call...").
   - Sign off cleanly with:
     Best,
     ${senderName}${senderLoc ? `\n     ${senderLoc}` : ""}${senderPhone ? `\n     ${senderPhone}` : ""}

Return a JSON object matching this exact TypeScript interface:
interface AIResponse {
  subject: string;
  body: string;
  personalization_hook: string;
  variants: {
    formal: { subject_options: string[]; body: string; };
    casual: { subject_options: string[]; body: string; };
    short: { subject_options: string[]; body: string; };
  };
  followups: {
    day4: { subject_options: string[]; body: string; };
    day7: { subject_options: string[]; body: string; };
  };
}

Only return the JSON block, no markdown formatting outside it.`;

  try {
    let raw = "";
    logger.info(`Generating mail for ${companyName} via ${provider} (${modelName})`, { source: "coldmail" });

    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const modelCandidates = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
      let lastErr: any = null;
      for (const mName of modelCandidates) {
        try {
          const model = genAI.getGenerativeModel({ model: mName });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
          });
          raw = result.response.text().trim();
          if (raw) break;
        } catch (e) {
          lastErr = e;
          logger.warn(`Gemini model ${mName} failed, trying next candidate...`, { error: String(e), source: "coldmail" });
        }
      }
      if (!raw) {
        throw new Error(`Gemini API failed across all models: ${String(lastErr)}`);
      }
    } else if (provider === "openrouter") {
      try {
        if (!env.OPENROUTER_API_KEY) {
          throw new Error("OPENROUTER_API_KEY is not set in backend environment (.env)");
        }
        const selectedModel = modelName || "deepseek/deepseek-chat";
        const { data } = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: selectedModel,
            messages: [
              {
                role: "system",
                content:
                  "You write concise, highly personalized internship cold emails and return valid JSON only.",
              },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.45,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
              "HTTP-Referer": env.CLIENT_ORIGIN || "http://localhost:3000",
              "X-Title": "Outly Cold Mailer",
            },
          },
        );
        raw = data.choices[0].message.content.trim();
      } catch (axiosError: any) {
        const msg = axiosError.response?.data?.error?.message || axiosError.message;
        logger.error(`OpenRouter API Error: ${msg}`, { data: axiosError.response?.data, source: "coldmail" });
        throw new Error(`OpenRouter API failed: ${msg}`);
      }
    } else {
      try {
        const { data } = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content:
                  "You write concise, highly personalized internship cold emails and return valid JSON only.",
              },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.45,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.GROK_API_KEY}`,
            },
          },
        );
        raw = data.choices[0].message.content.trim();
      } catch (axiosError: any) {
        const msg = axiosError.response?.data?.error?.message || axiosError.message;
        logger.error(`Groq API Error: ${msg}`, { data: axiosError.response?.data, source: "coldmail" });
        throw new Error(`Groq API failed: ${msg}`);
      }
    }

    const parsedJson = extractJson(raw);
    const parsed = validateDraft(parsedJson, companyName) as any;
    parsed.variants = parsedJson.variants || null;
    parsed.followups = parsedJson.followups || null;

    await companyQueries.updateStatus(companyId, "mail_generated", {
      generated_subject: parsed.subject,
      generated_mail: parsed.body,
      personalization_hook: parsed.personalization_hook,
      generated_variants_json: JSON.stringify(parsed),
      error_message: null,
    });

    logger.info(`Generated mail for ${companyName} via ${provider}`, { source: "coldmail" });
    return parsed;
  } catch (e) {
    logger.error(`Mail generation failed for ${companyName} via ${provider}`, {
      error: String(e),
      source: "coldmail",
    });
    await companyQueries.updateStatus(companyId, "scraped", { error_message: String(e) });
    return null;
  }
}
