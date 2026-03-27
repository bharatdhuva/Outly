import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { companyQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";
import { scrapeCompany } from "./companyScraper.js";

export interface GeneratedMail {
  subject: string;
  body: string;
  personalization_hook: string;
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
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(cleaned) as GeneratedMail;
}

function ensureParagraphBreaks(body: string): string {
  const normalized = body.replace(/\r\n/g, "\n").trim();
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= 8) {
    return normalized;
  }

  // Force the exact structure if the model returns a collapsed paragraph.
  const sentences = normalized
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const greeting = lines.find((line) => /^hi\b/i.test(line)) || sentences.shift() || "";
  const hook = sentences.shift() || "";
  const intro = sentences.shift() || "";
  const whyThem = sentences.shift() || "";
  const cta = sentences.shift() || "";
  const thanks =
    sentences.find((line) => /^thanks for your time!?$/i.test(line)) || "Thanks for your time!";

  return [
    greeting,
    "",
    hook,
    "",
    intro,
    "",
    whyThem,
    "",
    cta,
    "",
    thanks,
    "",
    "Best,",
    "Bharat Dhuva",
    "Vadodara, Gujarat",
    "+91 9624828661",
    "https://www.linkedin.com/in/bharatdhuva27/",
  ]
    .filter(Boolean)
    .join("\n");
}

function extractSingleDraft(body: string): string {
  const normalized = body.replace(/\r\n/g, "\n").trim();
  const firstGreetingIndex = normalized.search(/^hi\s.+/im);
  const working = firstGreetingIndex >= 0 ? normalized.slice(firstGreetingIndex) : normalized;

  const linkedInMarker = "https://www.linkedin.com/in/bharatdhuva27/";
  const firstClosingEnd = working.indexOf(linkedInMarker);
  if (firstClosingEnd !== -1) {
    return working.slice(0, firstClosingEnd + linkedInMarker.length).trim();
  }

  const duplicateGreetingMatch = working.match(/\n\s*\n(?=Hi\s)/g);
  if (duplicateGreetingMatch && duplicateGreetingMatch.length > 0) {
    const splitIndex = working.search(/\n\s*\n(?=Hi\s)/);
    if (splitIndex !== -1) {
      return working.slice(0, splitIndex).trim();
    }
  }

  return working;
}

function ensureRequiredStructure(body: string): string {
  const normalized = extractSingleDraft(body.replace(/\r\n/g, "\n").trim());
  const blocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const greeting = blocks.find((block) => /^hi\s/i.test(block)) || "Hi Team,";
  const hook = blocks.find((block) => /came across your recent/i.test(block)) || "";
  const intro =
    blocks.find((block) => /I[’']?m Bharat Dhuva|I am Bharat Dhuva/i.test(block)) ||
    "I’m Bharat Dhuva, a 3rd-year Computer Science student at MSU Baroda, Vadodara. Over the past year, I’ve been working with React, TypeScript, and Node.js on several full-stack projects.";
  const whyThem =
    blocks.find((block) => /I[’']?d love to intern at|I would love to intern at/i.test(block)) || "";
  const ctaExisting = blocks.find((block) => /10-minute call|10 minute call/i.test(block)) || "";
  const cta = ctaExisting.includes("attached my resume")
    ? ctaExisting
    : `I’ve attached my resume for your reference. ${ctaExisting || "Would you be open to a quick 10-minute call if there’s any possibility?"}`.trim();
  const thanks = blocks.find((block) => /^Thanks for your time!?$/i.test(block)) || "Thanks for your time!";

  return [
    greeting,
    hook,
    intro,
    whyThem,
    cta,
    thanks,
    "Best,",
    "Bharat Dhuva",
    "Vadodara, Gujarat",
    "+91 9624828661",
    "https://www.linkedin.com/in/bharatdhuva27/",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function validateDraft(parsed: Partial<GeneratedMail>, companyName: string): GeneratedMail {
  if (!parsed.subject || !parsed.body || !parsed.personalization_hook) {
    throw new Error("Model returned incomplete JSON");
  }

  const subject = parsed.subject.trim();
  const body = ensureRequiredStructure(ensureParagraphBreaks(parsed.body.trim()));
  const hook = parsed.personalization_hook.trim();

  const requiredChecks = [
    { ok: subject.length >= 3, error: "Subject is too short" },
    { ok: /^hi\s/i.test(body), error: "Body must start with greeting" },
    { ok: body.includes("I’m Bharat Dhuva") || body.includes("I'm Bharat Dhuva"), error: "Missing Bharat intro line" },
    { ok: body.includes("MSU Baroda") || body.includes("Maharaja Sayajirao University"), error: "Missing MSU reference" },
    { ok: body.includes("I’ve attached my resume for your reference.") || body.includes("I've attached my resume for your reference."), error: "Missing resume line" },
    { ok: body.includes("Would you be open to a quick 10-minute call"), error: "Missing CTA line" },
    { ok: body.includes("Thanks for your time!"), error: "Missing thanks line" },
    { ok: body.includes("Best,"), error: "Missing closing" },
    { ok: body.includes("Bharat Dhuva"), error: "Missing sender name in closing" },
    { ok: body.includes("Vadodara, Gujarat"), error: "Missing location in closing" },
    { ok: body.includes("+91 9624828661"), error: "Missing phone in closing" },
    { ok: body.includes("https://www.linkedin.com/in/bharatdhuva27/"), error: "Missing LinkedIn in closing" },
    { ok: body.toLowerCase().includes(companyName.toLowerCase()), error: "Missing company name in body" },
    { ok: hook.length > 8, error: "Personalization hook is too weak" },
  ];

  const failed = requiredChecks.find((check) => !check.ok);
  if (failed) {
    throw new Error(`Draft validation failed: ${failed.error}`);
  }

  return {
    subject,
    body,
    personalization_hook: hook,
  };
}

export async function generateMailForCompany(
  companyId: number,
  provider: "gemini" | "grok" = "gemini",
): Promise<GeneratedMail | null> {
  const company = companyQueries.getById(companyId);
  if (!company) return null;

  if (company.status === "pending") {
    logger.info(`Auto-scraping ${company.company_name} before generation...`, { source: "coldmail" });
    await scrapeCompany(companyId);
  }

  const c = companyQueries.getById(companyId)!;
  const scrapedCtx = c.scraped_context ? (JSON.parse(c.scraped_context) as Record<string, any>) : {};

  const senderName = c.sender_name || "Bharat Dhuva";
  const senderLoc = c.sender_location || "Vadodara, Gujarat";
  const experience = c.experience_level || "3rd-year Computer Science student";
  const skills = c.key_skills || "React, TypeScript, and Node.js";
  const targetName = c.target_person_name || `${c.company_name} Team`;
  const targetRole = c.target_person_role || "Hiring Team";
  const companyName = c.company_name;
  const roleApplying = c.role || "Software Developer Intern";
  const hook = c.personalization_hook || "";

  const researchSection = buildResearchSection(scrapedCtx, hook);
  const candidateHooks = uniqueStrings([
    hook,
    ...(scrapedCtx.hookCandidates ?? []),
    ...(scrapedCtx.socialSignals ?? []),
    ...(scrapedCtx.recentNews ?? []),
    ...(scrapedCtx.pageHighlights ?? []),
  ], 8);

  const prompt = `You are writing a highly personalized internship cold email for Bharat Dhuva.

STYLE REFERENCE ONLY:
${coldMailGuide || "Keep it short, warm, and company-specific."}

GOAL:
- Research-first email
- Use the best available latest company-specific signal from website, product pages, blog/news pages, or social pages
- Use coldmail-format.md only as tone/style guidance, never as a fixed template
- The email must feel freshly written from the scraped company research and lead fields

STRICT RULES:
- Subject should be short and specific
- Email should be concise and natural, usually under 120 words
- Warm, genuine, humble, confident
- Humanized, not spoofed, not boring
- No buzzwords or corporate fluff
- No hallucinations
- Do not say latest post / whitepaper / update unless the research explicitly supports it
- Use the strongest company-specific hook from the research
- Make "why them" come directly from the researched signal, product, update, blog, hiring theme, or tech direction
- End with one clear call to action only
- Avoid these words: passionate, excited, opportunity, leverage, synergy, looking forward

PERSON:
- Sender name: ${senderName}
- Sender location: ${senderLoc}
- Background: ${experience}
- Skills: ${skills}

TARGET:
- Company: ${companyName}
- Contact name: ${targetName}
- Contact role: ${targetRole}
- Role applying for: ${roleApplying}

RESEARCH:
${researchSection}

HOOK PRIORITY ORDER:
${candidateHooks.map((item) => `- ${item}`).join("\n")}

WRITING INSTRUCTIONS:
- First decide what the single strongest hook is from the research
- Then write the email around that hook
- Mention only details that are supported by the research or lead fields
- If the company research is thin, stay simple and honest instead of fabricating
- Make the email sound like one human wrote it for this one company today
- Follow this exact body structure, but do NOT hardcode the content:
  Subject:
  [Company Name] [Recent Thing] was interesting

  Body:
  Hi [Company] Team,

  I came across your recent [whitepaper / LinkedIn post / update] and really liked the insights — especially [short positive comment].

  I’m Bharat Dhuva, a 3rd-year Computer Science student at MSU Baroda, Vadodara. Over the past year, I’ve been working with [skills] on several full-stack projects.

  I’d love to intern at [Company Name] as a Software Developer. It would be great to learn from your team and contribute to actual projects while gaining real experience.

  I’ve attached my resume for your reference. Would you be open to a quick 10-minute call if there’s any possibility?

  Thanks for your time!

  Best,
  Bharat Dhuva
  Vadodara, Gujarat
  +91 9624828661
  https://www.linkedin.com/in/bharatdhuva27/
- Company specificity is mandatory
- The hook line must be based on real scraped detail, not a placeholder
- Keep the wording natural and non-robotic
- Do not output square brackets or placeholder text
- Use "Hi [Target Person Name]," only if the person name is clearly available; otherwise use "Hi [Company] Team,"
- Replace "Software Developer" with the actual applied role only if it fits naturally and stays close to this template

OUTPUT JSON ONLY:
{
  "subject": "short personalized subject",
  "body": "final email body",
  "personalization_hook": "the exact company-specific hook used"
}`;

  try {
    let raw = "";
    logger.info(`Generating mail for ${companyName} via ${provider}`, { source: "coldmail" });

    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.45, responseMimeType: "application/json" },
      });
      raw = result.response.text().trim();
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

    const parsed = validateDraft(extractJson(raw), companyName);

    companyQueries.updateStatus(companyId, "mail_generated", {
      generated_subject: parsed.subject,
      generated_mail: parsed.body,
      personalization_hook: parsed.personalization_hook,
      error_message: null,
    } as any);

    logger.info(`Generated mail for ${companyName} via ${provider}`, { source: "coldmail" });
    return parsed;
  } catch (e) {
    logger.error(`Mail generation failed for ${companyName} via ${provider}`, {
      error: String(e),
      source: "coldmail",
    });
    companyQueries.updateStatus(companyId, "scraped", { error_message: String(e) } as any);
    return null;
  }
}
