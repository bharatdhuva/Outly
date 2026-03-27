import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

export async function generateDailyTweet(topicContext?: string): Promise<string | null> {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const contextStr = topicContext ? `Context for today: ${topicContext}` : "Provide a random, interesting 'Today I Learned' (TIL) about software engineering, computer science, or web development.";

  const prompt = `You are a passionate, slightly opinionated but professional software engineering student building your personal brand on Twitter/X.
${contextStr}

Write a single highly engaging tweet.
RULES:
- Maximum 280 characters.
- Start with a strong hook.
- Include 1-2 relevant hashtags.
- No cringy corporate speak. Sound authentic and builder-focused.
- Return ONLY the exact text of the tweet. Do not wrap in quotes or markdown.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 },
    });
    return result.response.text().trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    logger.error("Failed to generate daily tweet", { error: String(error), source: "twitter" });
    return null;
  }
}

export async function generateWeeklyThread(topicContext?: string): Promise<string[] | null> {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const contextStr = topicContext ? `Feature this topic: ${topicContext}` : "Pick a deep-dive topic about a modern web rendering pattern, a complex algorithm explained simply, or a career lesson learned from building projects.";

  const prompt = `You are an insightful software engineering student writing a Twitter/X thread (3 to 5 tweets).
${contextStr}

Write a highly engaging thread.
RULES:
- Each tweet must be under 280 characters.
- Tweet 1: The hook. Make them want to read the rest. End with "🧵👇"
- Tweets 2-4: The value/breakdown.
- Final Tweet: The takeaway/conclusion, asking a question to drive engagement. Include 2 relevant hashtags.
- Return the output as a valid JSON array of strings, where each string is a tweet. 
- Example format: ["Tweet 1 text", "Tweet 2 text", "Tweet 3 text"]
- DO NOT wrap the output in markdown code blocks like \`\`\`json. Return EXACTLY the JSON array.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
    });
    
    let text = result.response.text().trim();
    if (text.startsWith("\`\`\`json")) text = text.replace("\`\`\`json", "");
    if (text.startsWith("\`\`\`")) text = text.substring(3);
    if (text.endsWith("\`\`\`")) text = text.slice(0, -3);

    const threadParts = JSON.parse(text.trim()) as string[];
    return threadParts.map(t => t.trim().substring(0, 280));
  } catch (error) {
    logger.error("Failed to generate weekly thread", { error: String(error), source: "twitter" });
    return null;
  }
}
