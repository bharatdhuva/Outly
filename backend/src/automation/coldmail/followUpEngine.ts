import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";

export interface FollowUpResponse {
  subject: string;
  body: string;
  new_angle: string;
}

export async function generateFollowUp(companyName: string, role: string, originalSubject: string): Promise<FollowUpResponse | null> {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You sent a cold email to ${companyName} 5 days ago about a ${role} internship.
There was no reply. Write a short follow-up (60-80 words MAX).

RULES:
- Do NOT start with "Just following up" — that's boring and obvious
- Come from a new angle: share a quick relevant insight, a new project update,
  or a one-line observation about their product/tech
- Reference that you emailed before in ONE line only
- Tone: confident, not desperate
- End with same soft CTA

OUTPUT FORMAT (JSON, no markdown wrapper, exactly the JSON):
{
  "subject": "Re: ${originalSubject}",
  "body": "...",
  "new_angle": "what new angle you used"
}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
    });
    let text = result.response.text().trim();
    if (text.startsWith("\`\`\`json")) text = text.replace("\`\`\`json", "");
    if (text.startsWith("\`\`\`")) text = text.substring(3);
    if (text.endsWith("\`\`\`")) text = text.slice(0, -3);

    return JSON.parse(text.trim()) as FollowUpResponse;
  } catch (error) {
    console.error("Gemini follow-up generation failed:", error);
    return null;
  }
}
