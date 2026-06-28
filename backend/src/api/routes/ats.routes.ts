import { Router, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";
import { checkAtsLimit } from "../../middleware/limits.js";
import { activityQueries } from "../../db/queries.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";
import CSSMatrix from "dommatrix";
import { createRequire } from "module";

// Polyfill DOMMatrix globally for pdfjs-dist / pdf-parse in Node.js
if (!(globalThis as any).DOMMatrix) {
  (globalThis as any).DOMMatrix = CSSMatrix;
}

const require = createRequire(import.meta.url);
let mammoth: any;
try {
  mammoth = require("mammoth");
} catch (e) {
  mammoth = null;
}

const router = Router();

// Protect all ATS routes with authentication
router.use(requireAuth);
const uploadDir = path.join(env.DATA_DIR, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// Helper to extract content wrapped in custom tags
function extractTagContent(text: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

// Helper to extract a list of items wrapped in custom tags
function extractTagList(text: string, tag: string): string[] {
  const content = extractTagContent(text, tag);
  if (!content) return [];
  return content
    .split("\n")
    .map(line => line.replace(/^[\s\-\*\d\.\)]+/, "").trim())
    .filter(line => line.length > 0);
}

// Helper to parse Gemini response trying JSON first and XML-like tags as fallback
function parseGeminiResponse(text: string, isScore: boolean) {
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    return JSON.parse(cleaned);
  } catch (e) {
    logger.info("JSON parsing failed, falling back to XML tag parsing", { error: String(e), source: "ats" });
    if (isScore) {
      const score = parseInt(extractTagContent(text, "score"), 10) || 0;
      const skills_match = parseInt(extractTagContent(text, "skills_match"), 10) || 0;
      const experience_match = parseInt(extractTagContent(text, "experience_match"), 10) || 0;
      const formatting_readability = parseInt(extractTagContent(text, "formatting_readability"), 10) || 0;
      const impact_metrics = parseInt(extractTagContent(text, "impact_metrics"), 10) || 0;
      const matched_keywords = extractTagList(text, "matched_keywords");
      const hard_skills = extractTagList(text, "missing_hard_skills");
      const soft_skills = extractTagList(text, "missing_soft_skills");
      const tools_technologies = extractTagList(text, "missing_tools_technologies");
      const seniority_match = extractTagContent(text, "seniority_match") || "Fair";
      const seniority_comments = extractTagContent(text, "seniority_comments");
      const formatting_issues = extractTagList(text, "formatting_issues");
      const suggestions = extractTagList(text, "suggestions");

      return {
        score,
        breakdown: {
          skills_match,
          experience_match,
          formatting_readability,
          impact_metrics
        },
        matched_keywords,
        missing_keywords: {
          hard_skills,
          soft_skills,
          tools_technologies
        },
        experience_analysis: {
          seniority_match,
          comments: seniority_comments
        },
        formatting_issues,
        suggestions
      };
    } else {
      const tailoredResume = extractTagContent(text, "tailored_resume");
      const matchedKeywords = extractTagList(text, "matched_keywords");
      const hard_skills = extractTagList(text, "missing_hard_skills");
      const soft_skills = extractTagList(text, "missing_soft_skills");
      const tools_technologies = extractTagList(text, "missing_tools_technologies");

      return {
        tailoredResume,
        matchedKeywords,
        missingKeywords: {
          hard_skills,
          soft_skills,
          tools_technologies
        }
      };
    }
  }
}

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
router.post("/parse-file", upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
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
      try {
        if (!(globalThis as any).DOMMatrix) {
          try { (globalThis as any).DOMMatrix = require("dommatrix"); } catch (_) {}
        }
        const pdfModule = require("pdf-parse");
        const buffer = fs.readFileSync(filePath);
        if (typeof pdfModule === "function") {
          const data = await pdfModule(buffer);
          text = data.text;
        } else if (pdfModule.PDFParse) {
          const parser = new pdfModule.PDFParse({ data: buffer });
          const data = await parser.getText();
          text = data.text;
          await parser.destroy().catch(() => {});
        } else if (pdfModule.default && typeof pdfModule.default === "function") {
          const data = await pdfModule.default(buffer);
          text = data.text;
        } else {
          throw new Error("Unknown pdf-parse export structure");
        }
      } catch (e: any) {
        logger.error("PDF parsing failed in ats route", { error: e?.message || String(e), source: "ats" });
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(500).json({ error: e?.message || "Failed to parse PDF document." });
      }
    } else if (ext === ".docx") {
      if (!mammoth) mammoth = require("mammoth");
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
router.post("/score", checkAtsLimit, async (req: AuthenticatedRequest, res: Response) => {
  const { resume, jd } = req.body;

  if (!resume) {
    return res.status(400).json({ error: "Resume is required." });
  }

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Log ATS check activity
  try {
    await activityQueries.add(req.user.id, "ats_check", "Ran ATS resume score check");
  } catch (err) {
    logger.error("Failed to log ATS check activity", { error: String(err), userId: req.user.id });
  }

  // Try Gemini first
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    let geminiPrompt = "";
    let fallbackPrompt = "";

    if (jd && jd.trim()) {
      geminiPrompt = `You are an expert Applicant Tracking System (ATS) evaluator and SRE/SDE recruiter.
Analyze the provided resume against the job description below.

CRITICAL: You MUST use Google Search to do an internet search for this role/company on Twitter/X, Reddit, and career-related sites to understand the latest trends, skills, and discussions. Integrate this grounded web search context into your evaluation.

Perform a strict and highly accurate evaluation. You must wrap the sections of your response in the following XML-like tags:
- Wrap the overall score (0 to 100) in <score>...</score>
- Wrap the skills match score (0 to 100) in <skills_match>...</skills_match>
- Wrap the experience match score (0 to 100) in <experience_match>...</experience_match>
- Wrap the formatting readability score (0-100) in <formatting_readability>...</formatting_readability>
- Wrap the impact metrics score (0-100) in <impact_metrics>...</impact_metrics>
- Wrap the list of matched keywords in <matched_keywords>
- List item 1
- List item 2
...
</matched_keywords>
- Wrap missing hard skills in <missing_hard_skills>
- List item 1
...
</missing_hard_skills>
- Wrap missing soft skills in <missing_soft_skills>
- List item 1
...
</missing_soft_skills>
- Wrap missing tools/technologies in <missing_tools_technologies>
- List item 1
...
</missing_tools_technologies>
- Wrap the seniority match level ("Good" | "Fair" | "Poor") in <seniority_match>...</seniority_match>
- Wrap seniority comments in <seniority_comments>...</seniority_comments>
- Wrap formatting issues in <formatting_issues>
- List item 1
...
</formatting_issues>
- Wrap suggestions in <suggestions>
- List item 1
...
</suggestions>

Do not return JSON. Use the tags listed above.

Resume:
${resume}

Job Description:
${jd}`;

      fallbackPrompt = `You are an expert Applicant Tracking System (ATS) evaluator and recruiter.
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
      geminiPrompt = `You are an expert Applicant Tracking System (ATS) evaluator and professional resume auditor.
Perform a comprehensive audit of the provided resume *without* matching it to a specific job description. 

CRITICAL: You MUST use Google Search to do an internet search for this candidate's target field/role on Twitter/X, Reddit, and career-related sites to understand the latest trends, skills, and discussions. Integrate this grounded web search context into your evaluation.

Analyze the resume for general ATS compatibility, formatting issues, action-verb usage, impact/quantifiable metrics, and overall professional quality.

You must wrap the sections of your response in the following XML-like tags:
- Wrap the overall score (0 to 100) in <score>...</score>
- Wrap the skills match score (0 to 100) in <skills_match>...</skills_match>
- Wrap the experience match score (0 to 100) in <experience_match>...</experience_match>
- Wrap the formatting readability score (0-100) in <formatting_readability>...</formatting_readability>
- Wrap the impact metrics score (0-100) in <impact_metrics>...</impact_metrics>
- Wrap the list of matched keywords in <matched_keywords>
- List item 1
...
</matched_keywords>
- Wrap missing hard skills in <missing_hard_skills>
- List item 1
...
</missing_hard_skills>
- Wrap missing soft skills in <missing_soft_skills>
- List item 1
...
</missing_soft_skills>
- Wrap missing tools/technologies in <missing_tools_technologies>
- List item 1
...
</missing_tools_technologies>
- Wrap the seniority match level ("Good" | "Fair" | "Poor") in <seniority_match>...</seniority_match>
- Wrap seniority comments in <seniority_comments>...</seniority_comments>
- Wrap formatting issues in <formatting_issues>
- List item 1
...
</formatting_issues>
- Wrap suggestions in <suggestions>
- List item 1
...
</suggestions>

Do not return JSON. Use the tags listed above.

Resume:
${resume}`;

      fallbackPrompt = `You are an expert Applicant Tracking System (ATS) evaluator and professional resume auditor.
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

    let text = "";

    try {
      logger.info("Running ATS resume evaluation via Gemini 2.5 Flash with Google Search grounding", { source: "ats" });
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} } as any] 
      });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: geminiPrompt }] }],
        generationConfig: { temperature: 0.2 },
      });
      text = result.response.text().trim();
    } catch (gemini25GroundedError) {
      logger.warn("Gemini 2.5 Flash with grounding failed for score, trying without grounding", { error: String(gemini25GroundedError), source: "ats" });
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: fallbackPrompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        });
        text = result.response.text().trim();
      } catch (gemini25Error) {
        logger.warn("Gemini 2.5 Flash failed for score, attempting fallback to Gemini 1.5 Flash with grounding", { error: String(gemini25Error), source: "ats" });
        try {
          const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            tools: [{ googleSearch: {} } as any]
          });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: geminiPrompt }] }],
            generationConfig: { temperature: 0.2 },
          });
          text = result.response.text().trim();
        } catch (gemini15GroundedError) {
          logger.warn("Gemini 1.5 Flash with grounding failed for score, trying without grounding", { error: String(gemini15GroundedError), source: "ats" });
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fallbackPrompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
          });
          text = result.response.text().trim();
        }
      }
    }

    const parsed = parseGeminiResponse(text, true);
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
router.post("/tailor", checkAtsLimit, async (req: AuthenticatedRequest, res: Response) => {
  const { resume, jd } = req.body;

  if (!resume) {
    return res.status(400).json({ error: "Resume content is required." });
  }
  if (!jd) {
    return res.status(400).json({ error: "Job description is required." });
  }

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Log ATS check activity
  try {
    await activityQueries.add(req.user.id, "ats_check", "Tailored resume to job description");
  } catch (err) {
    logger.error("Failed to log ATS check activity for tailoring", { error: String(err), userId: req.user.id });
  }

  const geminiPrompt = `You are an expert resume writer, professional editor, and career coach.
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

You must wrap the sections of your response in the following XML-like tags:
- Wrap the tailored resume in clean, professionally-structured Markdown format inside <tailored_resume>...</tailored_resume>
- Wrap the list of matched keywords in <matched_keywords>
- List item 1
- List item 2
...
</matched_keywords>
- Wrap recommended missing hard skills to add in <missing_hard_skills>
- List item 1
...
</missing_hard_skills>
- Wrap recommended missing soft skills to add in <missing_soft_skills>
- List item 1
...
</missing_soft_skills>
- Wrap recommended missing tools/technologies to add in <missing_tools_technologies>
- List item 1
...
</missing_tools_technologies>

Do not return JSON. Use the tags listed above.`;

  const fallbackPrompt = `You are an expert resume writer, professional editor, and career coach.
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

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    let text = "";
    let responseObj: any = null;

    try {
      logger.info("Generating tailored resume via Gemini 2.5 Flash with Google Search grounding", { source: "ats" });
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} } as any] 
      });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: geminiPrompt }] }],
        generationConfig: { temperature: 0.3 },
      });
      text = result.response.text().trim();
      responseObj = result.response;
    } catch (gemini25GroundedError) {
      logger.warn("ATS tailoring via Gemini 2.5 Flash with grounding failed, trying without grounding", { error: String(gemini25GroundedError), source: "ats" });
      try {
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash"
        });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: fallbackPrompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
        });
        text = result.response.text().trim();
        responseObj = result.response;
      } catch (gemini25Error) {
        logger.warn("ATS tailoring via Gemini 2.5 Flash without grounding failed, trying Gemini 1.5 Flash with grounding", { error: String(gemini25Error), source: "ats" });
        try {
          const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            tools: [{ googleSearch: {} } as any] 
          });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: geminiPrompt }] }],
            generationConfig: { temperature: 0.3 },
          });
          text = result.response.text().trim();
          responseObj = result.response;
        } catch (gemini15GroundedError) {
          logger.warn("ATS tailoring via Gemini 1.5 Flash with grounding failed, trying without grounding", { error: String(gemini15GroundedError), source: "ats" });
          const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash"
          });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fallbackPrompt }] }],
            generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
          });
          text = result.response.text().trim();
          responseObj = result.response;
        }
      }
    }

    const parsed = parseGeminiResponse(text, false);

    // Extract grounding sources
    const sources: Array<{ title: string; url: string; domain: string }> = [];
    const groundingMetadata = responseObj?.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingChunks) {
      const seenUrls = new Set<string>();
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web && chunk.web.uri) {
          const url = chunk.web.uri;
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            let domain = "";
            try {
              domain = new URL(url).hostname.replace("www.", "");
            } catch (e) {
              domain = url;
            }
            sources.push({
              title: chunk.web.title || domain,
              url: url,
              domain: domain
            });
          }
        }
      }
    }

    res.json({
      tailoredResume: parsed.tailoredResume || "",
      matchedKeywords: parsed.matchedKeywords || [],
      missingKeywords: parsed.missingKeywords || { hard_skills: [], soft_skills: [], tools_technologies: [] },
      sources: sources
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
          missingKeywords: parsed.missingKeywords || { hard_skills: [], soft_skills: [], tools_technologies: [] },
          sources: []
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
          missingKeywords: parsed.missingKeywords || { hard_skills: [], soft_skills: [], tools_technologies: [] },
          sources: []
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
