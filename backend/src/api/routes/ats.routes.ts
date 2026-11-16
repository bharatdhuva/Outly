import { Router, Response } from "express";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";
import { checkAtsLimit, checkTailorLimit } from "../../middleware/limits.js";
import { verifyDemoSession, checkDemoQuota } from "../../middleware/demoGuard.js";
import { ActivityLog as ActivityLogModel } from "../../db/models.js";
import { activityQueries } from "../../db/queries.js";
import { uploadResume } from "../../middleware/upload.js";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const requireLocal = createRequire(import.meta.url);

const router = Router();
router.use(requireAuth);
router.use(verifyDemoSession);

router.get("/limit-status", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.plan === "pro") {
    return res.json({
      plan: "pro",
      used: 0,
      limit: null,
      isLimitExceeded: false,
      unlockAt: null,
    });
  }

  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const checks = await ActivityLogModel.find({
      userId: req.user.id,
      type: "ats_check",
      createdAt: { $gte: twelveHoursAgo },
    })
      .sort({ createdAt: 1 })
      .lean();

    const used = checks.length;
    const isLimitExceeded = used >= 3;
    let unlockAt: string | null = null;
    if (isLimitExceeded && checks.length > 0) {
      const oldestCheck = checks[0];
      unlockAt = new Date(new Date(oldestCheck.createdAt).getTime() + 12 * 60 * 60 * 1000).toISOString();
    }

    return res.json({
      plan: "free",
      used,
      limit: 3,
      isLimitExceeded,
      unlockAt,
    });
  } catch (error) {
    logger.error("Failed to check ATS limit status", { error: String(error) });
    return res.status(500).json({ error: "Failed to fetch limit status" });
  }
});

function getPythonBase(req?: AuthenticatedRequest): string {
  const host = req?.headers?.host || (process.env.VERCEL ? "www.outly.online" : "");
  if (typeof (env as any).getPythonAtsUrl === "function") {
    return (env as any).getPythonAtsUrl(host);
  }
  return env.PYTHON_ATS_URL.replace(/\/$/, "");
}

function pythonHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (env.PYTHON_ATS_INTERNAL_KEY) {
    headers["X-Internal-Key"] = env.PYTHON_ATS_INTERNAL_KEY;
  }
  return headers;
}

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
const LINK_RE = /linkedin\.com|github\.com|portfolio|behance|dribbble/i;

const SECTION_PATTERNS: Record<string, RegExp> = {
  summary: /\b(summary|professional summary|objective|career objective|profile|about me)\b/i,
  skills: /\b(skills|technical skills|core competencies|technologies|programming languages)\b/i,
  experience: /\b(experience|work history|employment|professional experience|work experience)\b/i,
  education: /\b(education|academic|university|college|degree)\b/i,
  projects: /\b(projects|personal projects|key projects)\b/i,
};

const ACTION_VERBS = new Set([
  "achieved", "architected", "automated", "built", "collaborated", "created",
  "delivered", "designed", "developed", "drove", "improved", "increased",
  "launched", "led", "optimized", "owned", "reduced", "implemented",
  "shipped", "scaled", "migrated", "refactored", "mentored", "deployed",
  "engineered", "spearheaded", "transformed", "managed", "executed", "produced",
  "directed", "established", "resolved"
]);

const QUANT_RE = /\b\d+(\.\d+)?\s?(%|x|ms|s|k|m|b)?\b|\$\s?\d+/i;
const SENTENCE_RE = /[.!?]+/;

const TAXONOMY_SKILLS = [
  "python", "javascript", "typescript", "react", "next.js", "node.js", "node", "html", "css",
  "sql", "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes", "aws", "azure", "gcp",
  "git", "github", "ci/cd", "rest api", "rest", "graphql", "linux", "agile", "scrum", "system design",
  "testing", "jest", "cypress", "tailwind", "redux", "express", "fastapi", "django", "java", "c++",
  "c#", "go", "rust", "microservices", "kafka", "rabbitmq", "terraform", "devops",
  "data structures", "algorithms", "oop", "machine learning", "pandas", "numpy", "tensorflow", "pytorch"
];

export function scoreResumeLocally(resume: string, jd?: string) {
  const text = (resume || "").trim();
  const jdText = (jd || "").trim();

  // 1. Contact Info (max 10)
  let contactScore = 0;
  const contactReasons: string[] = [];
  if (EMAIL_RE.test(text)) {
    contactScore += 4;
    contactReasons.push("Email address detected in the document body.");
  } else {
    contactReasons.push("No email address found in the body (headers/footers may be invisible to ATS).");
  }
  if (PHONE_RE.test(text)) {
    contactScore += 3;
    contactReasons.push("Phone number detected.");
  } else {
    contactReasons.push("No phone number detected.");
  }
  if (LINK_RE.test(text)) {
    contactScore += 3;
    contactReasons.push("LinkedIn, GitHub, or portfolio URL detected.");
  } else {
    contactReasons.push("No LinkedIn/GitHub URL detected.");
  }

  // 2. Section Headings (max 20)
  const weights: Record<string, number> = { summary: 4, skills: 5, experience: 5, education: 4, projects: 2 };
  let sectionScore = 0;
  const sectionReasons: string[] = [];
  for (const [sec, w] of Object.entries(weights)) {
    if (SECTION_PATTERNS[sec].test(text)) {
      sectionScore += w;
      sectionReasons.push(`Found a ${sec} section.`);
    } else {
      sectionReasons.push(`Missing a clear ${sec} heading.`);
    }
  }

  // 3. Length & Format (max 10)
  const words = text.match(/\b\w+\b/g) || [];
  const wordCount = words.length;
  let lengthScore = 10;
  const lengthReasons: string[] = [];
  const formattingIssues: string[] = [];

  if (wordCount < 250) {
    lengthScore -= 5;
    lengthReasons.push(`Resume is short (${wordCount} words); ATS parsers prefer 400–900 words.`);
    formattingIssues.push("Resume appears shorter than a typical one-to-two page CV.");
  } else if (wordCount > 1400) {
    lengthScore -= 4;
    lengthReasons.push(`Resume is long (${wordCount} words); consider tightening to two pages.`);
    formattingIssues.push("Length may exceed typical ATS/recruiter attention span.");
  } else {
    lengthReasons.push(`Length looks reasonable (${wordCount} words).`);
  }

  if (/\|.+\|/.test(text) || (text.split("\t").length - 1) > 20) {
    lengthScore -= 2;
    formattingIssues.push("Table-like or multi-column markers detected; these often break ATS parsers.");
    lengthReasons.push("Possible table/column layout detected.");
  }
  if (/[\uE000-\uF8FF]/.test(text)) {
    lengthScore -= 1;
    formattingIssues.push("Private-use / icon glyphs detected; replace icons with plain text.");
  }
  lengthScore = Math.max(0, lengthScore);

  // 4. Bullet Points & Action Verbs (max 20)
  const bulletMatches: string[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^[-*•●\d+.)]\s+(.+)$/);
    if (match) {
      bulletMatches.push(match[1]);
    } else if (trimmed.length > 40 && trimmed.length < 280) {
      bulletMatches.push(trimmed);
    }
  }
  const scoredBullets = bulletMatches.slice(0, 25);
  let verbHits = 0;
  let quantHits = 0;
  for (const b of scoredBullets) {
    const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
    if (firstWord && ACTION_VERBS.has(firstWord)) {
      verbHits++;
    }
    if (QUANT_RE.test(b)) {
      quantHits++;
    }
  }
  const totalB = Math.max(1, scoredBullets.length);
  const verbRatio = verbHits / totalB;
  const quantRatio = quantHits / totalB;
  let bulletScore = 6 + (verbRatio * 8) + (quantRatio * 6);
  bulletScore = Math.min(20, Math.max(4, Math.round(bulletScore * 10) / 10));
  const bulletReasons = [
    `${verbHits}/${totalB} bullets start with an action verb.`,
    `${quantHits}/${totalB} bullets include a number or measurable metric.`
  ];

  // 5. Keyword Coverage (max 25)
  const textLower = text.toLowerCase();
  const matchedSkills: string[] = [];
  for (const skill of TAXONOMY_SKILLS) {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const reg = new RegExp(`\\b${escaped}\\b`, "i");
    if (reg.test(textLower)) {
      matchedSkills.push(skill);
    }
  }

  let keywordScore = 0;
  const keywordReasons: string[] = [];
  const missingKeywords = {
    hard_skills: [] as string[],
    soft_skills: ["Communication", "Problem-solving", "Team collaboration"],
    tools_technologies: [] as string[]
  };

  if (jdText) {
    const jdLower = jdText.toLowerCase();
    const jdSkills = TAXONOMY_SKILLS.filter(s => {
      const escaped = s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      return new RegExp(`\\b${escaped}\\b`, "i").test(jdLower);
    });
    const common = jdSkills.filter(s => matchedSkills.includes(s));
    const missing = jdSkills.filter(s => !matchedSkills.includes(s));
    const ratio = jdSkills.length > 0 ? common.length / jdSkills.length : 0.7;
    keywordScore = Math.round(ratio * 25 * 10) / 10;
    keywordReasons.push(`Matched ${common.length} of ${jdSkills.length} skills found in the Job Description.`);
    missingKeywords.hard_skills = missing.slice(0, 8);
  } else {
    const density = Math.min(1, matchedSkills.length / 10);
    keywordScore = Math.round((12 + density * 13) * 10) / 10;
    keywordReasons.push(`Detected ${matchedSkills.length} technical skills on the resume.`);
    missingKeywords.hard_skills = ["Role-specific keywords from a target Job Description"];
  }

  // 6. Readability (max 15)
  const sentences = text.split(SENTENCE_RE).filter(s => s.trim().length > 0);
  const avgSentence = sentences.length > 0 ? wordCount / sentences.length : 15;
  let readabilityScore = 12;
  const readabilityReasons: string[] = [];
  if (avgSentence > 32) {
    readabilityScore -= 4;
    readabilityReasons.push(`Average sentence length is high (${Math.round(avgSentence)} words).`);
  } else if (avgSentence < 8) {
    readabilityScore -= 2;
    readabilityReasons.push("Sentences look fragmented; verify layout formatting.");
  } else {
    readabilityReasons.push(`Sentence length is clear and readable (${Math.round(avgSentence)} words on average).`);
  }
  const firstPersonCount = (text.match(/\b(I|my|myself|me)\b/gi) || []).length;
  if (firstPersonCount > 8) {
    readabilityScore -= 2;
    readabilityReasons.push("Frequent first-person pronouns; ATS-friendly resumes typically omit personal pronouns.");
  }
  readabilityScore = Math.max(0, Math.min(15, readabilityScore));

  // Overall Score
  const totalScore = Math.round(contactScore + sectionScore + lengthScore + bulletScore + keywordScore + readabilityScore);
  const overall = Math.max(15, Math.min(100, totalScore));

  // Suggestions & Warnings
  const suggestions: string[] = [];
  const warnings: string[] = [];
  if (contactScore < 7) {
    suggestions.push("Place your email, phone, and LinkedIn URL cleanly at the top of your resume.");
  }
  if (sectionScore < 16) {
    suggestions.push("Use standard section headings (Professional Experience, Education, Skills, Projects).");
  }
  if (bulletScore < 14) {
    suggestions.push("Begin bullet points with strong action verbs (e.g. Architected, Optimized, Shipped) and include quantified results.");
  }
  if (missingKeywords.hard_skills.length > 0) {
    suggestions.push(`Consider adding relevant skills: ${missingKeywords.hard_skills.slice(0, 5).join(", ")}.`);
  }
  if (suggestions.length === 0) {
    suggestions.push("Keep section headings standard and metrics in bullets for maximum ATS readability.");
  }

  if (!EMAIL_RE.test(text)) {
    formattingIssues.push("Ensure contact email is in the main body text, not nested inside an inaccessible graphic or header.");
    warnings.push("Contact email missing from extracted text.");
  }

  // Seniority
  const yearMatch = text.match(/\b(\d{1,2})\+?\s*(?:years?|yrs?)\b/i);
  const years = yearMatch ? parseInt(yearMatch[1], 10) : 3;

  const breakdown = {
    skills_match: Math.round((keywordScore / 25) * 100),
    experience_match: Math.round((sectionScore / 20) * 100),
    formatting_readability: Math.round(((contactScore / 10 + lengthScore / 10 + readabilityScore / 15) / 3) * 100),
    impact_metrics: Math.round((bulletScore / 20) * 100),
  };

  const breakdown_detail = {
    contact_info: { score: contactScore, max: 10, reasons: contactReasons },
    sections: { score: sectionScore, max: 20, reasons: sectionReasons },
    length_format: { score: lengthScore, max: 10, reasons: lengthReasons },
    bullet_quality: { score: bulletScore, max: 20, reasons: bulletReasons },
    keyword_coverage: { score: keywordScore, max: 25, reasons: keywordReasons },
    readability: { score: readabilityScore, max: 15, reasons: readabilityReasons },
  };

  return {
    score: overall,
    overall_score: overall,
    isValidResume: true,
    breakdown,
    breakdown_detail,
    matched_keywords: matchedSkills.slice(0, 15),
    missing_keywords: missingKeywords,
    experience_analysis: {
      seniority_match: "Good" as const,
      comments: `Resume indicates approximately ${years} years of professional experience.`
    },
    formatting_issues: formattingIssues,
    suggestions: suggestions.slice(0, 6),
    warnings,
    llm_analysis: null,
  };
}

async function proxyJson(
  req: AuthenticatedRequest,
  res: Response,
  path: string
): Promise<void> {
  const pythonBase = getPythonBase(req);
  const primaryUrl = `${pythonBase}${path}`;
  try {
    const response = await fetch(primaryUrl, {
      method: "POST",
      headers: pythonHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(req.body ?? {}),
      signal: AbortSignal.timeout(45000),
    });

    const text = await response.text();
    // Guard against Cloudflare challenge pages or raw HTML error responses
    if (text.includes("<!DOCTYPE") || text.includes("<html") || text.includes("challenges.cloudflare.com")) {
      logger.warn("Python ATS internal request was intercepted by Cloudflare challenge", { primaryUrl, status: response.status });
      res.status(503).json({ error: "ATS service momentarily unreachable. Retrying with deterministic engine." });
      return;
    }

    let payload: unknown = { error: text || "Python ATS service error." };
    try {
      payload = JSON.parse(text);
    } catch {
      // keep text payload
    }
    res.status(response.status).json(payload);
  } catch (error) {
    logger.error("Python ATS proxy failed", {
      path,
      primaryUrl,
      error: String(error),
      source: "ats",
    });
    res.status(503).json({ error: "ATS service unavailable. Please retry shortly." });
  }
}

let mammothInstance: any = null;

async function parseResumeLocally(filePath: string, originalName: string): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  }

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    let pdfModule: any;
    try {
      pdfModule = requireLocal("pdf-parse");
    } catch {
      try {
        const imp: any = await import("pdf-parse");
        pdfModule = imp.default || imp;
      } catch (impErr) {
        logger.error("Failed to load pdf-parse module", { error: String(impErr) });
      }
    }

    if (typeof pdfModule === "function") {
      const data = await pdfModule(buffer);
      if (typeof data === "string") return data;
      if (data && typeof data.text === "string") return data.text;
      if (data && Array.isArray(data.pages)) return data.pages.map((p: any) => p.text).join("\n");
      return "";
    } else if (pdfModule?.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const data = await parser.getText();
      await parser.destroy().catch(() => { });
      if (typeof data === "string") return data;
      if (data && typeof data.text === "string") return data.text;
      if (data && Array.isArray(data.pages)) return data.pages.map((p: any) => p.text).join("\n");
      return "";
    }
    return "";
  }

  if (ext === ".docx") {
    if (!mammothInstance) {
      try {
        mammothInstance = requireLocal("mammoth");
      } catch {
        mammothInstance = (await import("mammoth")).default as any;
      }
    }
    const buffer = fs.readFileSync(filePath);
    const result = await mammothInstance.extractRawText({ buffer });
    return result.value || "";
  }

  return fs.readFileSync(filePath, "utf-8");
}

router.post("/parse-file", checkDemoQuota("resume_upload"), checkAtsLimit, uploadResume.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  // 1. Primary: Fast, direct local parser (PDF via pdf-parse, DOCX via mammoth, TXT)
  try {
    const text = await parseResumeLocally(filePath, originalName);
    if (text && text.trim().length > 0) {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) { }
      }
      return res.json({
        filename: originalName,
        content: text.trim(),
      });
    }
  } catch (localError: any) {
    logger.warn("Local parser failed, trying Python ATS fallback", {
      filename: originalName,
      error: String(localError),
      source: "ats",
    });
  }

  // 2. Secondary: Python FastAPI microservice fallback
  try {
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const form = new FormData();
      form.append("file", new Blob([new Uint8Array(buffer)]), originalName);

      const pythonBase = getPythonBase(req);
      const response = await fetch(`${pythonBase}/api/ats/parse-file`, {
        method: "POST",
        headers: pythonHeaders(),
        body: form,
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.content) {
          return res.json(data);
        }
      }
    }
  } catch (pythonError) {
    logger.error("Both local and Python file parsing failed", {
      filename: originalName,
      error: String(pythonError),
      source: "ats",
    });
  } finally {
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) { }
    }
  }

  return res.status(500).json({ error: "Failed to extract text from file. Please upload a valid PDF, DOCX, or TXT." });
});

router.post("/score", checkDemoQuota("ats_check"), checkAtsLimit, async (req: AuthenticatedRequest, res: Response) => {
  const { resume, jd } = req.body ?? {};
  if (!resume || typeof resume !== "string" || !resume.trim()) {
    return res.status(400).json({ error: "Resume is required." });
  }

  if (req.user) {
    try {
      await activityQueries.add(req.user.id, "ats_check", "Ran ATS resume score check");
    } catch (err) {
      logger.error("Failed to log ATS check activity", { error: String(err), userId: req.user.id });
    }
  }

  // 1. Attempt Python ATS microservice first (via direct internal Vercel URL to bypass Cloudflare)
  const pythonBase = getPythonBase(req);
  const primaryUrl = `${pythonBase}/api/ats/score`;
  try {
    const response = await fetch(primaryUrl, {
      method: "POST",
      headers: pythonHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(req.body ?? {}),
      signal: AbortSignal.timeout(8000),
    });

    const text = await response.text();
    if (response.ok && !text.includes("<!DOCTYPE") && !text.includes("<html") && !text.includes("challenges.cloudflare.com")) {
      try {
        const payload = JSON.parse(text);
        if (payload && (typeof payload.score === "number" || typeof payload.overall_score === "number")) {
          return res.json(payload);
        }
      } catch {}
    }
    logger.warn("Python ATS returned non-OK or non-JSON", { status: response.status, primaryUrl });
  } catch (err) {
    logger.warn("Python ATS fetch failed or timed out, executing deterministic local scorer", { error: String(err), primaryUrl });
  }

  // 2. Deterministic local scoring fallback: Fast, 100% reliable, zero Cloudflare hops
  try {
    const localScore = scoreResumeLocally(resume, jd);
    return res.json(localScore);
  } catch (scoreErr) {
    logger.error("Local ATS scoring fallback error", { error: String(scoreErr) });
    return res.status(500).json({ error: "Failed to score resume. Please try again." });
  }
});

router.post("/tailor", checkDemoQuota("ats_tailor"), checkTailorLimit, async (req: AuthenticatedRequest, res: Response) => {
  const { resume, jd } = req.body ?? {};
  if (!resume) {
    return res.status(400).json({ error: "Resume content is required." });
  }
  if (!jd) {
    return res.status(400).json({ error: "Job description is required." });
  }
  if (req.user) {
    try {
      await activityQueries.add(req.user.id, "ats_tailor", "Tailored resume to job description");
    } catch (err) {
      logger.error("Failed to log ATS check activity for tailoring", { error: String(err), userId: req.user.id });
    }
  }
  await proxyJson(req, res, "/api/ats/tailor");
});

router.post("/match", checkDemoQuota("ats_check"), checkAtsLimit, async (req: AuthenticatedRequest, res: Response) => {
  const { resume, jd } = req.body ?? {};
  if (!resume || !jd) {
    return res.status(400).json({ error: "Both resume and jd are required." });
  }
  if (req.user) {
    try {
      await activityQueries.add(req.user.id, "ats_match", "Ran Resume to JD matching");
    } catch (err) {
      logger.error("Failed to log match activity", { error: String(err) });
    }
  }
  await proxyJson(req, res, "/api/ats/match");
});

export default router;
