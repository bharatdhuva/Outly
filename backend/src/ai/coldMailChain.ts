import { z } from "zod";
import { getChatModel } from "./llm.js";
import { coldMailPrompt } from "./prompts.js";
import { logger } from "../lib/logger.js";

/**
 * Zod schema for single email variant
 */
export const ColdMailVariantSchema = z.object({
  variant_name: z.string().describe("e.g. 'Variant A: Metrics-Driven' or 'Variant B: Problem-Solver'"),
  subject: z.string().describe("Engaging subject line under 60 characters"),
  body: z.string().describe("Full email body text without markdown placeholders"),
  angle: z.string().describe("Brief note explaining the psychological angle of this variant"),
});

/**
 * Zod schema for complete Cold Mail generation output
 */
export const ColdMailResultSchema = z.object({
  subject: z.string().describe("Primary high-converting subject line"),
  body: z.string().describe("Primary personalized cold email body"),
  personalization_hook: z.string().describe("The specific sentence or observation used to hook the recipient"),
  variants: z.array(ColdMailVariantSchema).describe("2 distinct A/B testing variants with different angles"),
});

export type ColdMailResult = z.infer<typeof ColdMailResultSchema>;

export interface ColdMailInput {
  companyName: string;
  targetRole?: string;
  websiteUrl?: string;
  targetPerson?: string;
  targetPersonRole?: string;
  keySkills?: string;
  experienceLevel?: string;
  senderName?: string;
  senderLocation?: string;
  personalizationHook?: string;
  scrapedContext?: string | Record<string, any>;
  resumeSummary?: string;
  modelName?: string;
}

function formatEmailBody(
  rawBody: string,
  recipient: string,
  sender: string,
  location?: string
): string {
  if (!rawBody) return "";
  let body = rawBody.trim();

  // Fix sentences run together without space/newlines (.As, .I'm, etc.)
  body = body.replace(/([.!?])([A-Z])/g, "$1\n\n$2");
  body = body.replace(/\r\n/g, "\n");

  // Deduplicate and split paragraphs
  const seen = new Set<string>();
  const paras = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => {
      if (!p || seen.has(p)) return false;
      seen.add(p);
      return true;
    });

  let text = paras.join("\n\n");

  // Ensure salutation
  if (!/^(hi|hey|hello|dear)\b/i.test(text.trim())) {
    text = `Hi ${recipient},\n\n${text}`;
  }

  // Ensure sign-off
  if (!/(best regards|warm regards|kind regards|regards|sincerely|best,)\s*\n?/i.test(text)) {
    text = `${text}\n\nBest regards,\n${sender}${location ? `\n${location}` : ""}`;
  }

  return text;
}

/**
 * Executes the Cold Email LangChain chain with Structured Output
 */
export async function generateColdEmailChain(input: ColdMailInput): Promise<ColdMailResult> {
  const startTime = Date.now();
  const recipient = input.targetPerson || (input.companyName ? `${input.companyName} Team` : "Hiring Team");
  const sender = input.senderName || "Bharat Dhuva";
  const location = input.senderLocation || "";

  logger.info(`[ColdMailChain] Starting cold email generation for company: ${input.companyName}`, {
    role: input.targetRole,
    recipient: input.targetPerson,
    source: "ai/coldMailChain",
  });

  const model = getChatModel({
    modelName: input.modelName ?? "gemini-2.5-flash",
    temperature: 0.3,
  });

  // Convert scraped context to readable string if it's an object
  let formattedScrapedContext = "No prior website scrape available.";
  if (typeof input.scrapedContext === "string" && input.scrapedContext.trim()) {
    formattedScrapedContext = input.scrapedContext;
  } else if (input.scrapedContext && typeof input.scrapedContext === "object") {
    formattedScrapedContext = JSON.stringify(input.scrapedContext, null, 2);
  }

  const promptVariables = {
    companyName: input.companyName || "the team",
    targetRole: input.targetRole || "Software Engineer",
    websiteUrl: input.websiteUrl || "Not specified",
    targetPerson: recipient,
    targetPersonRole: input.targetPersonRole || "Engineering Leadership",
    keySkills: input.keySkills || "Full-stack development, LLMs, APIs",
    experienceLevel: input.experienceLevel || "Entry / Intermediate",
    senderName: sender,
    senderLocation: location,
    personalizationHook: input.personalizationHook || "Focus on recent product momentum and modern tech stack.",
    scrapedContext: formattedScrapedContext,
    resumeSummary: input.resumeSummary || "Hands-on builder proficient in React, Node.js, LangChain, and AI APIs.",
  };

  try {
    // Attempt withStructuredOutput using Zod schema
    const structuredLlm = model.withStructuredOutput(ColdMailResultSchema, {
      name: "cold_mail_result",
    });

    const chain = coldMailPrompt.pipe(structuredLlm);
    const result = await chain.invoke(promptVariables);

    // Apply strict formatting rules to ensure proper paragraphs, greeting, and signature
    result.body = formatEmailBody(result.body, recipient, sender, location);
    if (Array.isArray(result.variants)) {
      result.variants = result.variants.map((v) => ({
        ...v,
        body: formatEmailBody(v.body, recipient, sender, location),
      }));
    }

    logger.info(`[ColdMailChain] Generated successfully in ${Date.now() - startTime}ms`, {
      company: input.companyName,
      variantsCount: result.variants?.length ?? 0,
      source: "ai/coldMailChain",
    });

    return result;
  } catch (error: any) {
    logger.warn(`[ColdMailChain] Primary structured output failed, attempting fallback JSON parse: ${error?.message}`, {
      source: "ai/coldMailChain",
    });

    try {
      // Fallback invocation requesting JSON
      const fallbackPrompt = await coldMailPrompt.formatMessages(promptVariables);
      const rawResponse = await model.invoke([
        ...fallbackPrompt,
        {
          role: "user",
          content: "Respond strictly with valid JSON conforming to { subject, body, personalization_hook, variants: [{ variant_name, subject, body, angle }] } without markdown ticks.",
        },
      ]);

      const text = typeof rawResponse.content === "string" ? rawResponse.content : JSON.stringify(rawResponse.content);
      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleaned);

      const parsedResult = ColdMailResultSchema.parse(parsed);
      parsedResult.body = formatEmailBody(parsedResult.body, recipient, sender, location);
      if (Array.isArray(parsedResult.variants)) {
        parsedResult.variants = parsedResult.variants.map((v) => ({
          ...v,
          body: formatEmailBody(v.body, recipient, sender, location),
        }));
      }
      return parsedResult;
    } catch (fallbackError: any) {
      logger.error(`[ColdMailChain] Fallback also failed: ${fallbackError?.message}`, {
        source: "ai/coldMailChain",
      });

      // Deterministic emergency fallback so the user/workflow is never broken
      const role = input.targetRole || "AI / Software Engineer";
      const company = input.companyName;

      return {
        subject: `Quick question regarding ${role} at ${company}`,
        body: `Hi ${recipient},\n\nI noticed ${company}'s impressive work in engineering and AI solutions. With strong hands-on experience in full-stack architecture, LLMs, and API integrations, I would love to contribute to your engineering velocity.\n\nI've attached my resume for your reference. Would you be open to a brief 10-minute chat this week?\n\nBest regards,\n${sender}${location ? `\n${location}` : ""}`,
        personalization_hook: `I've been following ${company}'s tech innovations and client delivery standards.`,
        variants: [
          {
            variant_name: "Variant A: Impact-Driven",
            subject: `Impact on ${company}'s ${role} initiatives`,
            body: `Hi ${recipient},\n\nHaving shipped real-world full-stack web applications and automated AI workflows, I wanted to reach out regarding the ${role} opening at ${company}.\n\nI've attached my resume for your reference. Would you be open to a 5-minute sync to discuss how my skillset directly aligns with your team's goals?\n\nBest regards,\n${sender}${location ? `\n${location}` : ""}`,
            angle: "Focuses on rapid execution, shipped products, and engineering impact.",
          },
          {
            variant_name: "Variant B: Tech Synergy",
            subject: `${company} + ${role} inquiry`,
            body: `Hi ${recipient},\n\nI have been exploring how ${company} solves complex tech challenges. Given my deep work with modern web frameworks and AI APIs, I believe I can hit the ground running with minimal ramp-up time.\n\nI've attached my resume for your reference. Could we connect briefly this Thursday or Friday?\n\nBest regards,\n${sender}${location ? `\n${location}` : ""}`,
            angle: "Emphasizes technical compatibility and low onboarding overhead.",
          },
        ],
      };
    }
  }
}
