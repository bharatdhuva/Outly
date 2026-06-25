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
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

const router = Router();
const upload = multer({ dest: path.join(env.DATA_DIR, "uploads") });

// Helper to evaluate resume using Anthropic Claude API
async function evaluateWithClaude(resume: string, jd: string | undefined, apiKey: string) {
  logger.info("Running ATS resume evaluation fallback via Claude", { source: "ats" });

  let prompt = "";
  if (jd && jd.trim()) {
    prompt = `You are an expert Applicant Tracking System (ATS) evaluator and SRE/SDE recruiter.
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
  } else {
    prompt = `You are an expert Applicant Tracking System (ATS) evaluator and professional resume auditor.
Perform a comprehensive audit of the provided resume *without* matching it to a specific job description. 
Analyze the resume for general ATS compatibility, formatting issues, action-verb usage, impact/quantifiable metrics, and overall professional quality.

Return a JSON object with:
1. "score": General ATS readiness score from 0 to 100.
2. "breakdown": An object containing:
   - "skills_match": Score 0-100 indicating depth and layout of technical skills.
   - "experience_match": Score 0-100 evaluating the structure, formatting, and relevance of work history.
   - "formatting_readability": Score 0-100 of structural suitability for ATS scanners (penalize multi-columns, tables, graphics, contact info in headers).
   - "impact_metrics": Score 0-100 assessing the use of strong action verbs and quantified achievements (e.g. percentages, revenue, time savings).
3. "matched_keywords": An array of the primary technical/hard skills, tools, and methodologies detected in the resume.
4. "missing_keywords": An object containing arrays:
   - "hard_skills": Crucial industry-standard technologies or skills related to the candidate's target field (inferred from the resume) that are currently missing or could be added.
   - "soft_skills": Interpersonal or execution-oriented keywords standard for this domain that are missing.
   - "tools_technologies": Essential tools, platforms, or systems commonly expected in this role that are missing.
5. "experience_analysis": An object containing:
   - "seniority_match": A string ("Good" | "Fair" | "Poor") representing the clarity of the candidate's experience progression.
   - "comments": A brief summary of the experience layout and career progression.
6. "formatting_issues": An array of strings outlining potential ATS readability bottlenecks found in the resume (e.g., "Found multi-column layout", "Contact details in header/footer", "Non-standard section headers").
7. "suggestions": An array of 3-5 high-impact, actionable improvements to make the resume beat automated filters.

Do not include any Markdown code fencing like \`\`\`json. Return only the raw JSON.

Resume:
${resume}`;
  }

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

// Helper to evaluate resume using Groq Llama API
async function scoreWithGroq(resume: string, jd: string | undefined, apiKey: string) {
  logger.info("Running ATS resume evaluation fallback via Groq", { source: "ats" });

  let prompt = "";
  if (jd && jd.trim()) {
    prompt = `You are an expert Applicant Tracking System (ATS) evaluator and recruiter.
Analyze the provided resume against the job description below.
Perform a strict and highly accurate evaluation. Return a JSON object with:
1. "score": Overall score from 0 to 100 based on key metrics.
2. "breakdown": An object containing:
   - "skills_match": Score 0-100 of how well the skills match.
   - "experience_match": Score 0-100 of how well the years of experience and seniority align.
   - "formatting_readability": Score 0-100 of structural suitability.
   - "impact_metrics": Score 0-100 assessing achievements and action verbs.
3. "matched_keywords": An array of technical/hard skills and tools found in both.
4. "missing_keywords": An object containing arrays:
   - "hard_skills": Crucial technologies or domain expertise missing from the resume.
   - "soft_skills": Interpersonal or execution terms missing.
   - "tools_technologies": Frameworks, platforms, tools missing.
5. "experience_analysis": An object containing:
   - "seniority_match": A string ("Good" | "Fair" | "Poor") rating.
   - "comments": A brief summary of seniority match.
6. "formatting_issues": An array of strings outlining potential ATS readability issues.
7. "suggestions": An array of 3-5 high-impact, actionable changes.

Do not include any Markdown code fencing like \`\`\`json. Return only the raw JSON.

Resume:
${resume}

Job Description:
${jd}`;
  } else {
    prompt = `You are an expert Applicant Tracking System (ATS) evaluator and professional resume auditor.
Perform a comprehensive audit of the provided resume *without* matching it to a specific job description. 
Return a JSON object with:
1. "score": General ATS readiness score from 0 to 100.
2. "breakdown": An object containing:
   - "skills_match": Score 0-100.
   - "experience_match": Score 0-100.
   - "formatting_readability": Score 0-100.
   - "impact_metrics": Score 0-100.
3. "matched_keywords": An array of technical/hard skills, tools, and methodologies.
4. "missing_keywords": An object containing arrays:
   - "hard_skills": Crucial industry-standard technologies or skills missing.
   - "soft_skills": Interpersonal keywords missing.
   - "tools_technologies": Essential tools/platforms missing.
5. "experience_analysis": An object containing:
   - "seniority_match": A string ("Good" | "Fair" | "Poor") rating.
   - "comments": A brief summary of experience layout.
6. "formatting_issues": An array of strings.
7. "suggestions": An array of 3-5 high-impact improvements.

Do not include any Markdown code fencing like \`\`\`json. Return only the raw JSON.

Resume:
${resume}`;
  }

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert ATS evaluator and recruiter. Return valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const text = response.data.choices[0].message.content.trim();
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
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      text = data.text;
      await parser.destroy().catch(() => {});
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

  if (!resume) {
    return res.status(400).json({ error: "Resume is required." });
  }

  // Try Gemini first
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    let prompt = "";
    if (jd && jd.trim()) {
      prompt = `You are an expert Applicant Tracking System (ATS) evaluator and SRE/SDE recruiter.
Analyze the provided resume against the job description below.

CRITICAL: You MUST use Google Search to do an internet search for this role/company on Twitter/X, Reddit, and career-related sites to understand the latest trends, skills, and discussions. Integrate this grounded web search context into your evaluation.

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
    } else {
      prompt = `You are an expert Applicant Tracking System (ATS) evaluator and professional resume auditor.
Perform a comprehensive audit of the provided resume *without* matching it to a specific job description. 

CRITICAL: You MUST use Google Search to do an internet search for this candidate's target field/role on Twitter/X, Reddit, and career-related sites to understand the latest trends, skills, and discussions. Integrate this grounded web search context into your evaluation.

Analyze the resume for general ATS compatibility, formatting issues, action-verb usage, impact/quantifiable metrics, and overall professional quality.

Return a JSON object with:
1. "score": General ATS readiness score from 0 to 100.
2. "breakdown": An object containing:
   - "skills_match": Score 0-100 indicating depth and layout of technical skills.
   - "experience_match": Score 0-100 evaluating the structure, formatting, and relevance of work history.
   - "formatting_readability": Score 0-100 of structural suitability for ATS scanners (penalize multi-columns, tables, graphics, contact info in headers).
   - "impact_metrics": Score 0-100 assessing the use of strong action verbs and quantified achievements (e.g. percentages, revenue, time savings).
3. "matched_keywords": An array of the primary technical/hard skills, tools, and methodologies detected in the resume.
4. "missing_keywords": An object containing arrays:
   - "hard_skills": Crucial industry-standard technologies or skills related to the candidate's target field (inferred from the resume) that are currently missing or could be added.
   - "soft_skills": Interpersonal or execution-oriented keywords standard for this domain that are missing.
   - "tools_technologies": Essential tools, platforms, or systems commonly expected in this role that are missing.
5. "experience_analysis": An object containing:
   - "seniority_match": A string ("Good" | "Fair" | "Poor") representing the clarity of the candidate's experience progression.
   - "comments": A brief summary of the experience layout and career progression.
6. "formatting_issues": An array of strings outlining potential ATS readability bottlenecks found in the resume (e.g., "Found multi-column layout", "Contact details in header/footer", "Non-standard section headers").
7. "suggestions": An array of 3-5 high-impact, actionable improvements to make the resume beat automated filters.

Do not include any Markdown code fencing like \`\`\`json. Return only the raw JSON.

Resume:
${resume}`;
    }

    let text = "";

    try {
      logger.info("Running ATS resume evaluation via Gemini 2.5 Flash with Google Search grounding", { source: "ats" });
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} } as any] 
      });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      });
      text = result.response.text().trim();
    } catch (gemini25GroundedError) {
      logger.warn("Gemini 2.5 Flash with grounding failed for score, trying without grounding", { error: String(gemini25GroundedError), source: "ats" });
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        });
        text = result.response.text().trim();
      } catch (gemini25Error) {
        logger.warn("Gemini 2.5 Flash failed for score, attempting fallback to Gemini 1.5 Flash with grounding", { error: String(gemini25Error), source: "ats" });
        try {
          const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            tools: [{ googleSearch: {} } as any]
          });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 },
          });
          text = result.response.text().trim();
        } catch (gemini15GroundedError) {
          logger.warn("Gemini 1.5 Flash with grounding failed for score, trying without grounding", { error: String(gemini15GroundedError), source: "ats" });
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
          });
          text = result.response.text().trim();
        }
      }
    }

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
    logger.warn("ATS score evaluation via Gemini (2.5 & 1.5) failed, checking fallbacks", { error: String(geminiError), source: "ats" });

    // Fallback 1: Try Groq
    if (env.GROK_API_KEY) {
      try {
        const parsed = await scoreWithGroq(resume, jd, env.GROK_API_KEY);
        return res.json(parsed);
      } catch (groqError) {
        logger.warn("ATS score evaluation fallback via Groq failed", { error: String(groqError), source: "ats" });
      }
    }

    // Fallback 2: Try Claude
    if (env.CLAUDE_API_KEY) {
      try {
        const parsed = await evaluateWithClaude(resume, jd, env.CLAUDE_API_KEY);
        return res.json(parsed);
      } catch (claudeError) {
        logger.warn("ATS score evaluation fallback via Claude failed", { error: String(claudeError), source: "ats" });
      }
    }

    logger.error("ATS score evaluation failed with no fallback available", { error: String(geminiError), source: "ats" });
    res.status(500).json({ error: `All evaluations failed.\nGemini Error: ${String(geminiError)}` });
  }
});

// Helper to tailor resume using Anthropic Claude API
async function tailorWithClaude(resume: string, jd: string, apiKey: string) {
  logger.info("Running resume tailoring fallback via Claude", { source: "ats" });

  const prompt = `You are an expert resume writer, professional editor, and career coach.
Your task is to tailor the candidate's resume specifically for the target job description provided.

Here is the original resume:
${resume}

Here is the target job description:
${jd}

Please optimize the resume to maximize ATS match score and professional appeal:
1. **Align Summary/Headline**: Revise the professional summary or headline to directly highlight the core competencies required for this role.
2. **Tailor Work Experience**: Rewrite bullet points under work history to emphasize relevant projects, technical skills, and tools mentioned in the job description. Keep dates, job titles, and company names exactly as in the original resume.
3. **Keyword Integration**: Naturally integrate critical hard skills, soft skills, and tools from the job description. Do not fabricate experience.
4. **Quantify Achievements**: Ensure achievements use strong action verbs and quantified impact metrics where possible.

You must return a JSON object containing:
1. "tailoredResume": The tailored resume in clean, professionally-structured Markdown format.
2. "matchedKeywords": An array of technical/hard skills, tools, and methodologies successfully incorporated/matched in the tailored resume.
3. "missingKeywords": An object containing arrays of recommended keywords that were NOT matching or could be added to other sections:
   - "hard_skills": Crucial industry-standard technologies or skills related to the candidate's target field that are missing or could be added.
   - "soft_skills": Interpersonal or execution-oriented keywords standard for this domain that are missing.
   - "tools_technologies": Essential tools, platforms, or systems commonly expected in this role that are missing.

Do not include any chat prefix or suffix (like "Here is your tailored resume..."). Return only the raw JSON.`;

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

// Helper to tailor resume using Groq Llama API
async function tailorWithGroq(resume: string, jd: string, apiKey: string) {
  logger.info("Running resume tailoring fallback via Groq", { source: "ats" });

  const prompt = `You are an expert resume writer, professional editor, and career coach.
Your task is to tailor the candidate's resume specifically for the target job description provided.

Here is the original resume:
${resume}

Here is the target job description:
${jd}

Please optimize the resume to maximize ATS match score and professional appeal:
1. **Align Summary/Headline**: Revise the professional summary or headline to directly highlight the core competencies required for this role.
2. **Tailor Work Experience**: Rewrite bullet points under work history to emphasize relevant projects, technical skills, and tools mentioned in the job description. Keep dates, job titles, and company names exactly as in the original resume.
3. **Keyword Integration**: Naturally integrate critical hard skills, soft skills, and tools from the job description. Do not fabricate experience.
4. **Quantify Achievements**: Ensure achievements use strong action verbs and quantified impact metrics where possible.

You must return a JSON object containing:
1. "tailoredResume": The tailored resume in clean, professionally-structured Markdown format.
2. "matchedKeywords": An array of technical/hard skills, tools, and methodologies successfully incorporated/matched in the tailored resume.
3. "missingKeywords": An object containing arrays of recommended keywords that were NOT matching or could be added to other sections:
   - "hard_skills": Crucial industry-standard technologies or skills related to the candidate's target field that are missing or could be added.
   - "soft_skills": Interpersonal or execution-oriented keywords standard for this domain that are missing.
   - "tools_technologies": Essential tools, platforms, or systems commonly expected in this role that are missing.

Do not include any chat prefix or suffix (like "Here is your tailored resume..."). Return only the raw JSON.`;

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer and career coach. Return the response as valid JSON matching the requested schema.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const text = response.data.choices[0].message.content.trim();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    parsed = JSON.parse(cleaned);
  }
  return parsed;
}

// POST tailor resume to job description
router.post("/tailor", async (req, res) => {
  const { resume, jd } = req.body;

  if (!resume) {
    return res.status(400).json({ error: "Resume content is required." });
  }
  if (!jd) {
    return res.status(400).json({ error: "Job description is required." });
  }

  const prompt = `You are an expert resume writer, professional editor, and career coach.
Your task is to tailor the candidate's resume specifically for the target job description provided.

CRITICAL: You MUST use Google Search to do an internet search for this role/company on Twitter/X, Reddit, LinkedIn, and related career sites.
Specifically, search for:
1. Recent Twitter/X posts, Reddit threads, or discussions about the target role ("${jd.substring(0, 100).replace(/[^a-zA-Z0-9 ]/g, '')}") or the technology stack to understand what SDEs/SREs are currently highlighting.
2. Career portals (like LinkedIn, Indeed, Glassdoor) or the target company's career page to see specific skill requirements and company culture/mission.
3. Industry standards and trends for this role.

Use the insights from your Google Search (especially Twitter/X, Reddit, and career portals) to enrich the tailored resume, updating the candidate's professional summary and experience bullet points to reflect these real-world trends, while keeping original company names, job titles, dates, and locations exactly the same.

Here is the original resume:
${resume}

Here is the target job description:
${jd}

Please optimize the resume to maximize ATS match score and professional appeal:
1. **Align Summary/Headline**: Revise the professional summary or headline to directly highlight the core competencies required for this role.
2. **Tailor Work Experience**: Rewrite bullet points under work history to emphasize relevant projects, technical skills, and tools mentioned in the job description. Keep dates, job titles, and company names exactly as in the original resume.
3. **Keyword Integration**: Naturally integrate critical hard skills, soft skills, and tools from the job description. Do not fabricate experience.
4. **Quantify Achievements**: Ensure achievements use strong action verbs and quantified impact metrics where possible.

You must return a JSON object containing:
1. "tailoredResume": The tailored resume in clean, professionally-structured Markdown format.
2. "matchedKeywords": An array of technical/hard skills, tools, and methodologies successfully incorporated/matched in the tailored resume.
3. "missingKeywords": An object containing arrays of recommended keywords that were NOT matching or could be added to other sections:
   - "hard_skills": Crucial industry-standard technologies or skills related to the candidate's target field that are missing or could be added.
   - "soft_skills": Interpersonal or execution-oriented keywords standard for this domain that are missing.
   - "tools_technologies": Essential tools, platforms, or systems commonly expected in this role that are missing.

Do not include any chat prefix or suffix (like "Here is your tailored resume..."). Return only the raw JSON.`;

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    let text = "";

    try {
      logger.info("Generating tailored resume via Gemini 2.5 Flash with Google Search grounding", { source: "ats" });
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} } as any] 
      });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      });
      text = result.response.text().trim();
    } catch (gemini25GroundedError) {
      logger.warn("ATS tailoring via Gemini 2.5 Flash with grounding failed, trying without grounding", { error: String(gemini25GroundedError), source: "ats" });
      try {
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash"
        });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        });
        text = result.response.text().trim();
      } catch (gemini25Error) {
        logger.warn("ATS tailoring via Gemini 2.5 Flash without grounding failed, trying Gemini 1.5 Flash with grounding", { error: String(gemini25Error), source: "ats" });
        try {
          const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            tools: [{ googleSearch: {} } as any] 
          });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 },
          });
          text = result.response.text().trim();
        } catch (gemini15GroundedError) {
          logger.warn("ATS tailoring via Gemini 1.5 Flash with grounding failed, trying without grounding", { error: String(gemini15GroundedError), source: "ats" });
          const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash"
          });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 },
          });
          text = result.response.text().trim();
        }
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
      parsed = JSON.parse(cleaned);
    }

    res.json({
      tailoredResume: parsed.tailoredResume || "",
      matchedKeywords: parsed.matchedKeywords || [],
      missingKeywords: parsed.missingKeywords || { hard_skills: [], soft_skills: [], tools_technologies: [] }
    });
  } catch (geminiError) {
    logger.warn("ATS tailoring via Gemini (2.5 & 1.5) failed, checking fallbacks", { error: String(geminiError), source: "ats" });

    // Fallback 1: Try Groq
    if (env.GROK_API_KEY) {
      try {
        const parsed = await tailorWithGroq(resume, jd, env.GROK_API_KEY);
        return res.json({
          tailoredResume: parsed.tailoredResume || "",
          matchedKeywords: parsed.matchedKeywords || [],
          missingKeywords: parsed.missingKeywords || { hard_skills: [], soft_skills: [], tools_technologies: [] }
        });
      } catch (groqError) {
        logger.warn("ATS tailoring fallback via Groq failed", { error: String(groqError), source: "ats" });
      }
    }

    // Fallback 2: Try Claude
    if (env.CLAUDE_API_KEY) {
      try {
        const parsed = await tailorWithClaude(resume, jd, env.CLAUDE_API_KEY);
        return res.json({
          tailoredResume: parsed.tailoredResume || "",
          matchedKeywords: parsed.matchedKeywords || [],
          missingKeywords: parsed.missingKeywords || { hard_skills: [], soft_skills: [], tools_technologies: [] }
        });
      } catch (claudeError) {
        logger.warn("ATS tailoring fallback via Claude failed", { error: String(claudeError), source: "ats" });
      }
    }

    logger.error("ATS tailoring failed with no fallback available", { error: String(geminiError), source: "ats" });
    res.status(500).json({ error: `All tailoring attempts failed.\nGemini Error: ${String(geminiError)}` });
  }
});

export default router;
