import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

let genAI: GoogleGenerativeAI | null = null;
if (env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

export async function improveDraftWithAI(
  originalDraft: string,
  platform: string,
  userInstruction: string
): Promise<{ improved_post: string; change_summary: string }> {
  // If no API key, pretend the user hand-edited it
  if (!genAI) {
    return {
      improved_post: userInstruction,
      change_summary: 'Manual edit applied (No GEMINI_API_KEY)',
    };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json' } });
  
  const prompt = `
You are improving a social media post draft based on user feedback.

ORIGINAL POST:
${originalDraft}

PLATFORM: ${platform}
USER INSTRUCTION: ${userInstruction}

RULES:
- Keep the core message and key facts
- Apply the user's instruction precisely
- Platform tone must stay correct:
  LinkedIn: professional but human
  Twitter: punchy, casual, max 280 chars
  Reddit: conversational paragraphs, no AI tells
- Do NOT add new facts the original didn't have
- If instruction is vague ('make better'), use judgment
- Output ONLY the improved post in the JSON block — no explanation, no preamble

OUTPUT FORMAT:
{
  "improved_post": "...",
  "change_summary": "1 line: what you changed and why"
}
`;

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  try {
    return JSON.parse(text || "{}");
  } catch (e) {
    return { improved_post: text, change_summary: 'Failed to parse JSON' };
  }
}
