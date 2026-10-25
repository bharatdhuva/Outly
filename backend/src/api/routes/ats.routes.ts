import { Router, Response } from "express";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";
import { checkAtsLimit, checkTailorLimit } from "../../middleware/limits.js";
import { ActivityLog as ActivityLogModel } from "../../db/models.js";
import { activityQueries } from "../../db/queries.js";
import { uploadResume } from "../../middleware/upload.js";
import fs from "fs";
import path from "path";

const router = Router();
router.use(requireAuth);

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

const pythonBase = env.PYTHON_ATS_URL.replace(/\/$/, "");

function pythonHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (env.PYTHON_ATS_INTERNAL_KEY) {
    headers["X-Internal-Key"] = env.PYTHON_ATS_INTERNAL_KEY;
  }
  return headers;
}

const FALLBACK_PYTHON_URL = "https://ai-features-qpw9.onrender.com";

async function proxyJson(
  req: AuthenticatedRequest,
  res: Response,
  path: string
): Promise<void> {
  const primaryUrl = `${pythonBase}${path}`;
  try {
    let response = await fetch(primaryUrl, {
      method: "POST",
      headers: pythonHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(req.body ?? {}),
      signal: AbortSignal.timeout(45000),
    });

    if ((response.status === 404 || response.status >= 500) && pythonBase !== FALLBACK_PYTHON_URL) {
      logger.warn(`Primary Python ATS responded with ${response.status} at ${primaryUrl}. Retrying with fallback ${FALLBACK_PYTHON_URL}${path}`);
      try {
        const fallbackRes = await fetch(`${FALLBACK_PYTHON_URL}${path}`, {
          method: "POST",
          headers: pythonHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(req.body ?? {}),
          signal: AbortSignal.timeout(45000),
        });
        if (fallbackRes.ok) {
          response = fallbackRes;
        }
      } catch (fbErr) {
        logger.error("Fallback Python ATS call failed", { error: String(fbErr) });
      }
    }

    const text = await response.text();
    let payload: unknown = { error: text || "Python ATS service error." };
    try {
      payload = JSON.parse(text);
    } catch {
      // keep text payload
    }
    res.status(response.status).json(payload);
  } catch (error) {
    if (pythonBase !== FALLBACK_PYTHON_URL) {
      try {
        const fallbackRes = await fetch(`${FALLBACK_PYTHON_URL}${path}`, {
          method: "POST",
          headers: pythonHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(req.body ?? {}),
          signal: AbortSignal.timeout(45000),
        });
        const text = await fallbackRes.text();
        let payload: unknown = { error: text || "Python ATS service error." };
        try {
          payload = JSON.parse(text);
        } catch {}
        res.status(fallbackRes.status).json(payload);
        return;
      } catch (fbErr) {
        logger.error("Fallback Python ATS also failed after network error", { error: String(fbErr) });
      }
    }

    logger.error("Python ATS proxy failed", {
      path,
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
    if (!(globalThis as any).DOMMatrix) {
      try {
        const domMatrixModule = await import("dommatrix");
        (globalThis as any).DOMMatrix = domMatrixModule.default || domMatrixModule;
      } catch (_) {}
    }
    const pdfParseImport: any = await import("pdf-parse");
    const pdfModule = pdfParseImport.default || pdfParseImport;
    const buffer = fs.readFileSync(filePath);
    if (typeof pdfModule === "function") {
      const data = await pdfModule(buffer);
      return data.text || "";
    } else if (pdfModule?.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const data = await parser.getText();
      await parser.destroy().catch(() => {});
      return data.text || "";
    }
    return "";
  }
  if (ext === ".docx") {
    if (!mammothInstance) {
      mammothInstance = (await import("mammoth")).default as any;
    }
    const buffer = fs.readFileSync(filePath);
    const result = await mammothInstance.extractRawText({ buffer });
    return result.value || "";
  }
  return fs.readFileSync(filePath, "utf-8");
}

router.post("/parse-file", checkAtsLimit, uploadResume.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  // 1. Try parsing via Python FastAPI microservice
  try {
    const buffer = fs.readFileSync(filePath);
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(buffer)]), originalName);

    let response = await fetch(`${pythonBase}/api/ats/parse-file`, {
      method: "POST",
      headers: pythonHeaders(),
      body: form,
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok && pythonBase !== FALLBACK_PYTHON_URL) {
      const fallbackForm = new FormData();
      fallbackForm.append("file", new Blob([new Uint8Array(buffer)]), originalName);
      try {
        const fbRes = await fetch(`${FALLBACK_PYTHON_URL}/api/ats/parse-file`, {
          method: "POST",
          headers: pythonHeaders(),
          body: fallbackForm,
          signal: AbortSignal.timeout(6000),
        });
        if (fbRes.ok) {
          response = fbRes;
        }
      } catch (_) {}
    }

    if (response.ok) {
      const data = await response.json();
      if (data && data.content) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.json(data);
      }
    }
  } catch (pythonError) {
    logger.warn("Python ATS parse failed or timed out, using local Node fallback parser", {
      filename: originalName,
      error: String(pythonError),
      source: "ats",
    });
  }

  // 2. Local Node.js fallback parser (pdf-parse / mammoth)
  try {
    const text = await parseResumeLocally(filePath, originalName);
    if (text && text.trim().length > 0) {
      return res.json({
        filename: originalName,
        content: text.trim(),
      });
    }
    throw new Error("Parsed content is empty");
  } catch (localError: any) {
    logger.error("Both Python and local file parsing failed", {
      filename: originalName,
      error: String(localError),
      source: "ats",
    });
    return res.status(500).json({ error: "Failed to extract text from file. Please upload a valid PDF, DOCX, or TXT." });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

router.post("/score", checkAtsLimit, async (req: AuthenticatedRequest, res: Response) => {
  const { resume } = req.body ?? {};
  if (!resume) {
    return res.status(400).json({ error: "Resume is required." });
  }
  if (req.user) {
    try {
      await activityQueries.add(req.user.id, "ats_check", "Ran ATS resume score check");
    } catch (err) {
      logger.error("Failed to log ATS check activity", { error: String(err), userId: req.user.id });
    }
  }
  await proxyJson(req, res, "/api/ats/score");
});

router.post("/tailor", checkTailorLimit, async (req: AuthenticatedRequest, res: Response) => {
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

router.post("/match", checkAtsLimit, async (req: AuthenticatedRequest, res: Response) => {
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
