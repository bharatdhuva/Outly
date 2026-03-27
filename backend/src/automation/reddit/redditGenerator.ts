import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

interface RedditPostContent {
  title: string;
  content: string;
}

export async function generateRedditPost(subreddit: string, topicContext?: string): Promise<RedditPostContent | null> {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const contextStr = topicContext ? `Focus on this topic: ${topicContext}` : "Share an interesting technical deep-dive, a career lesson learned, or a unique open-source project building experience.";

  const prompt = `You are a software engineer active on Reddit writing a post for the r/${subreddit} community.
${contextStr}

RULES:
- Match the native tone of the subreddit exactly (e.g. r/developersIndia is casual, somewhat cynical but supportive; r/cscareerquestions is professional but direct).
- Write a catchy, highly relevant title.
- The body should be insightful, formatted with Markdown (use bolding, bullet points, headers if necessary).
- Do not sound like an AI. Include personal reflections and minor imperfections in phrasing.
- End with a question to drive discussion in the comments.
- Do NOT include any self-promotion or links.

OUTPUT FORMAT (JSON, no markdown wrapper):
{
  "title": "Your catchy post title",
  "content": "Your markdown formatted post body"
}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 },
    });
    
    let text = result.response.text().trim();
    if (text.startsWith("\`\`\`json")) text = text.replace("\`\`\`json", "");
    if (text.startsWith("\`\`\`")) text = text.substring(3);
    if (text.endsWith("\`\`\`")) text = text.slice(0, -3);

    return JSON.parse(text.trim()) as RedditPostContent;
  } catch (error) {
    logger.error(`Failed to generate Reddit post for r/${subreddit}`, { error: String(error), source: "reddit" });
    return null;
  }
}
