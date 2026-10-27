import { z } from "zod";
import { getChatModel } from "./llm.js";
import { coldMailPrompt } from "./prompts.js";
import { retrieveCompanyContext, type RetrievedSnippet } from "./rag/index.js";
import { logger } from "../lib/logger.js";

/**
 * Zod schema for single email variant (A/B testing)
 */
export const ColdMailVariantSchema = z.object({
  variant_name: z.string().describe("e.g. 'Variant A: Impact & Metrics' or 'Variant B: Problem-Solver & Tech-Synergy'"),
  subject: z.string().describe("Engaging, non-spammy subject line under 60 characters"),
  body: z.string().describe("Full email body text strictly formatted with paragraph breaks"),
  angle: z.string().describe("Brief note explaining the psychological outreach angle of this variant"),
});

/**
 * Zod schema for complete Cold Mail generation output with primary email and A/B variants
 */
export const ColdMailResultSchema = z.object({
  subject: z.string().describe("Primary high-converting subject line"),
  body: z.string().describe("Primary personalized cold email body grounded in retrieved context"),
  personalization_hook: z.string().describe("The specific verified company insight used to hook the recipient"),
  variants: z.array(ColdMailVariantSchema).describe("2 distinct A/B testing variants with different angles"),
});

export type ColdMailResult = z.infer<typeof ColdMailResultSchema>;

export interface ColdMailInput {
  companyId?: string;
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

/**
 * Helper to ensure professional email formatting:
 * - Proper paragraph separation with blank lines (\n\n)
 * - Salutation
 * - Signature
 */
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
 * Executes the Cold Email LangChain RAG pipeline:
 * 
 * 1. Semantic Chunking & Embedding:
 *    - Cleans the company website content.
 *    - Splits it into discrete semantic chunks using RecursiveCharacterTextSplitter.
 *    - Generates embeddings using Google text-embedding-004.
 *    - Indexes chunks into an in-memory VectorStore.
 * 
 * 2. Targeted Semantic Retrieval:
 *    - Builds a targeted query from the candidate profile (target role, key skills, hook).
 *    - Retrieves ONLY the top-k most relevant chunks using vector cosine similarity.
 * 
 * 3. Grounded Generation (LCEL + Anti-Hallucination):
 *    - Injects only the retrieved relevant chunks into the prompt.
 *    - Enforces strict anti-hallucination rules (no made-up facts or funding).
 *    - Produces a Primary Email + 2 distinct A/B variants using Zod structured output.
 */
export async function generateColdEmailChain(input: ColdMailInput): Promise<ColdMailResult> {
  const startTime = Date.now();
  const recipient = input.targetPerson || (input.companyName ? `${input.companyName} Team` : "Hiring Team");
  const sender = input.senderName?.trim() || "Applicant";
  const location = input.senderLocation || "";

  logger.info(`[ColdMailChain] Starting RAG cold email generation for: ${input.companyName}`, {
    role: input.targetRole,
    recipient: input.targetPerson,
    source: "ai/coldMailChain",
  });

  // Step 1: Perform RAG retrieval to get only the most relevant chunks from the vector store
  let retrievedContext = "No prior website scrape available.";
  let retrievedSnippets: RetrievedSnippet[] = [];

  try {
    const ragResult = await retrieveCompanyContext({
      companyId: input.companyId,
      companyName: input.companyName,
      targetRole: input.targetRole,
      keySkills: input.keySkills,
      personalizationHook: input.personalizationHook,
      scrapedData: input.scrapedContext,
      websiteUrl: input.websiteUrl,
      topK: 4,
    });

    retrievedContext = ragResult.formattedContext;
    retrievedSnippets = ragResult.snippets;

    logger.info(`[ColdMailChain] RAG retrieval complete: ${ragResult.retrievedCount} chunks from ${ragResult.totalChunksIndexed} total indexed`, {
      company: input.companyName,
      source: "ai/coldMailChain",
    });
  } catch (ragError: any) {
    logger.warn(`[ColdMailChain] RAG retrieval encountered error, falling back to basic context: ${ragError?.message}`, {
      source: "ai/coldMailChain",
    });
    if (typeof input.scrapedContext === "string" && input.scrapedContext.trim()) {
      retrievedContext = input.scrapedContext.slice(0, 1500);
    }
  }

  // Step 2: Initialize Chat Model (Gemini)
  const model = getChatModel({
    modelName: input.modelName,
    temperature: 0.3,
  });

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
    scrapedContext: retrievedContext, // Only the retrieved relevant context chunks passed!
    resumeSummary: input.resumeSummary || "Hands-on builder proficient in React, Node.js, LangChain, and AI APIs.",
  };

  try {
    // Step 3: LCEL Chain with Zod Structured Output
    const structuredLlm = model.withStructuredOutput(ColdMailResultSchema, {
      name: "cold_mail_result",
    });

    const chain = coldMailPrompt.pipe(structuredLlm);
    const result = await chain.invoke(promptVariables);

    // Apply strict formatting rules to ensure clean, scannable paragraphs and sign-offs
    result.body = formatEmailBody(result.body, recipient, sender, location);
    if (Array.isArray(result.variants)) {
      result.variants = result.variants.map((v) => ({
        ...v,
        body: formatEmailBody(v.body, recipient, sender, location),
      }));
    }

    logger.info(`[ColdMailChain] Cold email generated via RAG in ${Date.now() - startTime}ms`, {
      company: input.companyName,
      variantsCount: result.variants?.length ?? 0,
      retrievedSnippetsCount: retrievedSnippets.length,
      source: "ai/coldMailChain",
    });

    return result;
  } catch (error: any) {
    logger.warn(`[ColdMailChain] Primary structured output failed, attempting fallback JSON parse: ${error?.message}`, {
      source: "ai/coldMailChain",
    });

    try {
      // Fallback invocation requesting JSON directly
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
      const role = input.targetRole || "Software Engineer";
      const company = input.companyName;

      return {
        subject: `Quick question regarding ${role} at ${company}`,
        body: `Hi ${recipient},\n\nI noticed ${company}'s impressive engineering work. With hands-on experience in full-stack architecture, LLMs, and API integrations, I would love to contribute to your engineering velocity.\n\nI've attached my resume for your reference. Would you be open to a brief 10-minute chat this week?\n\nBest regards,\n${sender}${location ? `\n${location}` : ""}`,
        personalization_hook: `I've been following ${company}'s technology initiatives and client solutions.`,
        variants: [
          {
            variant_name: "Variant A: Impact-Driven",
            subject: `Impact on ${company}'s ${role} initiatives`,
            body: `Hi ${recipient},\n\nHaving shipped real-world full-stack web applications and automated AI workflows, I wanted to reach out regarding the ${role} opening at ${company}.\n\nI've attached my resume for your reference. Would you be open to a 5-minute sync to discuss how my skillset directly aligns with your team's goals?\n\nBest regards,\n${sender}${location ? `\n${location}` : ""}`,
            angle: "Focuses on rapid execution, shipped products, and engineering velocity.",
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
