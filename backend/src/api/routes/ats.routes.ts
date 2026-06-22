import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

const router = Router();

router.post("/score", async (req, res) => {
  const { resume, jd } = req.body;

  if (!resume || !jd) {
    return res.status(400).json({ error: "Both resume and jd are required." });
  }

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an ATS resume scanner. Given the resume and job description below, return a JSON object with:
- score: number 0-100
- matched_keywords: string[]
- missing_keywords: string[]
- suggestions: string[] (3-5 actionable fixes)
Only return JSON, no extra text.

Resume:
${resume}

Job Description:
${jd}`;

    logger.info("Running ATS resume evaluation via Gemini", { source: "ats" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    });

    const text = result.response.text().trim();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Fallback in case Gemini returns slightly malformed JSON
      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
      parsed = JSON.parse(cleaned);
    }

    res.json(parsed);
  } catch (error) {
    logger.error("ATS score evaluation failed", { error: String(error), source: "ats" });
    res.status(500).json({ error: String(error) });
  }
});

export default router;
