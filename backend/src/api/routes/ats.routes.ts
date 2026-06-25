import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const router = Router();
const upload = multer({ dest: path.join(env.DATA_DIR, "uploads") });

// Helper to evaluate resume using Anthropic Claude API
async function evaluateWithClaude(resume: string, jd: string, apiKey: string) {
  logger.info("Running ATS resume evaluation fallback via Claude", { source: "ats" });

  const prompt = `You are an expert Applicant Tracking System (ATS) evaluator and SRE/SDE recruiter.
Analyze the provided resume against the job description below.
Perform a strict and highly accurate evaluation. Return a JSON object with:
1. "score": Overall score from 0 to 100 based on key metrics.
2. "breakdown": An object containing:
   - "skills_match": Score 0-100 of how well the skills match.
   - "experience_match": Score 0-100 of how well the years of experience and seniority align.
   - "formatting_readability": Score 0-100 of structural suitability (penalize headers, footers, multi-column layouts, graphics, complex styling).
   - "impact_metrics": Score 0-100 assessing the use of strong action verbs and quantified achievements (e.g. percentages, revenue, time savings).
3. "matched_keywords": An array of technical/hard skills and tools found in both.
4. "missing_keywords": An object containing arrays:
   - "hard_skills": Crucial technologies, programming languages, or domain expertise in the JD but missing from the resume.
   - "soft_skills": Interpersonal, leadership, or execution-style terms from the JD missing from the resume.
   - "tools_technologies": Frameworks, platforms, tools (e.g., Redis, Git, Docker, JIRA) from the JD missing from the resume.
5. "experience_analysis": An object containing:
   - "seniority_match": A string ("Good" | "Fair" | "Poor") rating.
   - "comments": A brief summary of seniority match (e.g., "Resume shows 3 years React, JD asks for 5 years Senior SDE").
6. "formatting_issues": An array of strings outlining potential ATS readability issues (e.g., "Detected complex formatting or columns", "Ensure email is in the main body").
7. "suggestions": An array of 3-5 high-impact, actionable changes (e.g., "Add Redis under technical skills", "Rephrase React bullet point to include performance metrics").

Do not include any Markdown code fencing like \`\`\`json. Return only the raw JSON.

Resume:
${resume}

Job Description:
${jd}`;

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    },
    {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      }
    }
  );

  const text = response.data.content[0].text.trim();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    parsed = JSON.parse(cleaned);
  }
  return parsed;
}

// POST parse uploaded file to plain text
router.post("/parse-file", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;
  const ext = path.extname(originalName).toLowerCase();

  try {
    let text = "";

    if (ext === ".txt") {
      text = fs.readFileSync(filePath, "utf-8");
    } else if (ext === ".pdf") {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Unsupported file type. Please upload a .txt, .pdf, or .docx file." });
    }

    // Clean up file after parsing
    fs.unlinkSync(filePath);
    res.json({ filename: originalName, content: text });
  } catch (error) {
    logger.error("File parsing failed", { filename: originalName, error: String(error), source: "ats" });
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ error: `Failed to parse file: ${String(error)}` });
  }
});

// POST score resume against job description
router.post("/score", async (req, res) => {
  const { resume, jd } = req.body;

  if (!resume || !jd) {
    return res.status(400).json({ error: "Both resume and jd are required." });
  }

  // Try Gemini first
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert Applicant Tracking System (ATS) evaluator and SRE/SDE recruiter.
Analyze the provided resume against the job description below.
Perform a strict and highly accurate evaluation. Return a JSON object with:
1. "score": Overall score from 0 to 100 based on key metrics.
2. "breakdown": An object containing:
   - "skills_match": Score 0-100 of how well the skills match.
   - "experience_match": Score 0-100 of how well the years of experience and seniority align.
   - "formatting_readability": Score 0-100 of structural suitability (penalize headers, footers, multi-column layouts, graphics, complex styling).
   - "impact_metrics": Score 0-100 assessing the use of strong action verbs and quantified achievements (e.g. percentages, revenue, time savings).
3. "matched_keywords": An array of technical/hard skills and tools found in both.
4. "missing_keywords": An object containing arrays:
   - "hard_skills": Crucial technologies, programming languages, or domain expertise in the JD but missing from the resume.
   - "soft_skills": Interpersonal, leadership, or execution-style terms from the JD missing from the resume.
   - "tools_technologies": Frameworks, platforms, tools (e.g., Redis, Git, Docker, JIRA) from the JD missing from the resume.
5. "experience_analysis": An object containing:
   - "seniority_match": A string ("Good" | "Fair" | "Poor") rating.
   - "comments": A brief summary of seniority match (e.g., "Resume shows 3 years React, JD asks for 5 years Senior SDE").
6. "formatting_issues": An array of strings outlining potential ATS readability issues (e.g., "Detected complex formatting or columns", "Ensure email is in the main body").
7. "suggestions": An array of 3-5 high-impact, actionable changes (e.g., "Add Redis under technical skills", "Rephrase React bullet point to include performance metrics").

Do not include any Markdown code fencing like \`\`\`json. Return only the raw JSON.

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
  } catch (geminiError) {
    logger.warn("ATS score evaluation via Gemini failed, checking fallback to Claude", { error: String(geminiError), source: "ats" });

    // Fallback to Claude if key is configured
    if (env.CLAUDE_API_KEY) {
      try {
        const parsed = await evaluateWithClaude(resume, jd, env.CLAUDE_API_KEY);
        return res.json(parsed);
      } catch (claudeError) {
        logger.error("ATS score evaluation fallback via Claude also failed", { error: String(claudeError), source: "ats" });
        return res.status(500).json({ error: `Both Gemini and Claude evaluations failed.\nGemini Error: ${String(geminiError)}\nClaude Error: ${String(claudeError)}` });
      }
    }

    logger.error("ATS score evaluation failed with no Claude fallback available", { error: String(geminiError), source: "ats" });
    res.status(500).json({ error: String(geminiError) });
  }
});

export default router;
