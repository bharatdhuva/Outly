import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

const router = Router();

router.post("/linkedin", async (req, res) => {
  const { jd, headline, about } = req.body;

  if (!jd) {
    return res.status(400).json({ error: "Job description is required." });
  }

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a professional resume writer and LinkedIn profile consultant.
Analyze the target Job Description, the current LinkedIn headline, and the current About section.
Optimize the headline and summary/about sections to incorporate relevant keywords from the JD.

Job Description:
${jd}

Current Headline:
${headline || "Not provided"}

Current About Section:
${about || "Not provided"}

Return STRICT JSON only:
{
  "optimized_headlines": [
    "Variant 1 (concise, keyword-rich, under 220 chars)",
    "Variant 2 (value proposition focused, under 220 chars)",
    "Variant 3 (skills & achievements focused, under 220 chars)"
  ],
  "optimized_about": "Full professional About summary section (<300 words), well-formatted with paragraph breaks.",
  "skills_to_add": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
  "missing_keywords": ["Keyword 1", "Keyword 2", "Keyword 3", "Keyword 4", "Keyword 5"]
}
Do not return any markdown code fencing or extra words outside the JSON object.`;

    logger.info("Running LinkedIn profile optimization via Gemini", { source: "optimizer" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
    });

    const text = result.response.text().trim();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Clean up markdown block if model outputted it
      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
      parsed = JSON.parse(cleaned);
    }

    res.json(parsed);
  } catch (error) {
    logger.error("LinkedIn profile optimization failed", { error: String(error), source: "optimizer" });
    res.status(500).json({ error: String(error) });
  }
});

export default router;
