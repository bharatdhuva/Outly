import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import type { NewsItem } from "./fetcher.js";

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch ? fencedMatch[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function generateStructuredText(
  prompt: string,
  fieldName: string,
  fallback: string,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      },
    });

    const parsed = extractJsonObject(result.response.text());
    const value = parsed?.[fieldName];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Generate a daily LinkedIn draft post using v2.3 prompt (student tone, 500-900 chars)
 */
export async function generateLinkedInDraft(newsItems: NewsItem[]): Promise<string> {
  const newsContext = newsItems
    .slice(0, 10)
    .map((n) => `- ${n.title} (${n.source})${n.summary ? `: ${n.summary.slice(0, 120)}` : ""}`)
    .join("\n");

  const ctaList = [
    "What do you think?",
    "What's your take on this?",
    "Do you agree? Let me know below.",
    "How do you see this playing out?",
    "Curious if anyone else feels the same way?",
  ];
  const randomCta = ctaList[Math.floor(Math.random() * ctaList.length)];

  const prompt = `You are Bharat Dhuva, a 20-year-old 3rd-year Computer Science student from Vadodara, Gujarat.
You are active in open source and building projects like InterviewOS.

Write a natural, engaging LinkedIn post based ONLY on today's tech news context below.

Rules:
- Ideal length: 500-900 characters
- Sound like a curious and hardworking student, not corporate
- Start with a strong hook
- Share 3-4 insights or learnings with your personal reflection
- End with this exact engagement line: "${randomCta}"
- Use natural line breaks and emojis sparingly
- Add 5-7 relevant hashtags at the very end only
- Never use phrases like "Thrilled to share", "Excited to announce", "Proud to"
- Write in first person
- No markdown asterisks

Return STRICT JSON only:
{
  "post": "full LinkedIn post text only"
}

Today's context / news:
${newsContext}`;

  return generateStructuredText(prompt, "post", "Check out today's tech updates!");
}

/**
 * Generate a weekly tech roundup LinkedIn post (Monday morning style)
 */
export async function generateWeeklyLinkedInPost(newsItems: NewsItem[]): Promise<string> {
  const newsSummary = newsItems
    .slice(0, 12)
    .map((n) => `- ${n.title} (${n.source}): ${n.url}`)
    .join("\n");

  const prompt = `You are Bharat Dhuva, a 20-year-old 3rd-year CSE student from Vadodara, Gujarat.
Write a weekly tech roundup LinkedIn post about this week's most exciting tech updates.

Tone: enthusiastic, curious, slightly opinionated but professional like a real tech-obsessed student, not a corporate bot.

Rules:
- Do not summarize generic articles
- Pick only the most exciting news
- Prioritize major AI news, new frameworks, major launches, or ecosystem drama
- If there is AI news related to India, prioritize it heavily
- Start with a catchy hook
- Include 3-4 updates with your own commentary
- Add one brief personal reflection
- End with a question for engagement
- Add 5-7 relevant hashtags at the very end only
- Target length: 800-1200 characters
- No markdown asterisks

Return STRICT JSON only:
{
  "post": "full LinkedIn post text only"
}

This week's top stories:
${newsSummary}`;

  return generateStructuredText(prompt, "post", "Check out this week's tech updates!");
}

/**
 * Generate a Twitter draft that targets startup founders / hiring managers.
 */
export async function generateTwitterDraft(newsItems: NewsItem[]): Promise<string> {
  const newsContext = newsItems
    .slice(0, 5)
    .map((n) => `- ${n.title}`)
    .join("\n");

  const ctaList = [
    "What do you think?",
    "What's your take on this?",
    "Do you agree?",
    "How do you see this playing out?",
    "Curious if anyone else feels the same way?",
  ];
  const randomCta = ctaList[Math.floor(Math.random() * ctaList.length)];

  const prompt = `You are Bharat Dhuva, a 20-year-old 3rd-year CS student from Vadodara.

Write a highly engaging and opinionated Twitter post under 280 characters based on today's tech news.

Rules:
- Target startup founders and engineering managers
- Sound witty, insightful, and highly competent
- Avoid generic corporate fluff
- End with this exact line if it fits naturally: "${randomCta}"
- Keep it plain text only
- No markdown asterisks

Return STRICT JSON only:
{
  "tweet": "full tweet text only"
}

Today's news:
${newsContext}`;

  return generateStructuredText(prompt, "tweet", "Some exciting news in tech today!");
}

export const generateLinkedInPost = generateWeeklyLinkedInPost;
