import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

const router = Router();

router.post("/generate", async (req, res) => {
  const { resume, jd, tone } = req.body;

  if (!resume || !jd) {
    return res.status(400).json({ error: "Both resume and jd are required." });
  }

  const selectedTone = tone || "Professional";

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a professional resume writer and career coach.
Generate a cover letter based on the resume and JD below.
Tone: ${selectedTone}. Make it sound human-written, not AI-generated.
Keep it under 350 words. No generic openers like 'I am writing to apply'.

Resume:
${resume}

Job Description:
${jd}`;

    logger.info("Generating cover letter via Gemini", { tone: selectedTone, source: "coverletter" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
    });

    const coverLetterText = result.response.text().trim();
    res.json({ coverLetter: coverLetterText });
  } catch (error) {
    logger.error("Cover letter generation failed", { error: String(error), source: "coverletter" });
    res.status(500).json({ error: String(error) });
  }
});

export default router;
