import { Router, Response } from "express";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";
import { checkAtsLimit, checkTailorLimit } from "../../middleware/limits.js";
import { activityQueries } from "../../db/queries.js";
import { uploadResume } from "../../middleware/upload.js";
import fs from "fs";

const router = Router();
router.use(requireAuth);

const pythonBase = env.PYTHON_ATS_URL.replace(/\/$/, "");

function pythonHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (env.PYTHON_ATS_INTERNAL_KEY) {
    headers["X-Internal-Key"] = env.PYTHON_ATS_INTERNAL_KEY;
  }
  return headers;
}

async function proxyJson(
  req: AuthenticatedRequest,
  res: Response,
  path: string
): Promise<void> {
  const url = `${pythonBase}${path}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: pythonHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(req.body ?? {}),
    });
    const text = await response.text();
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
      error: String(error),
      source: "ats",
    });
    res.status(503).json({ error: "ATS service unavailable. Please retry shortly." });
  }
}

router.post("/parse-file", uploadResume.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  try {
    const buffer = fs.readFileSync(filePath);
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(buffer)]), originalName);

    const response = await fetch(`${pythonBase}/api/ats/parse-file`, {
      method: "POST",
      headers: pythonHeaders(),
      body: form,
    });
    const text = await response.text();
    let payload: unknown = { error: text || "Failed to parse file." };
    try {
      payload = JSON.parse(text);
    } catch {
      // keep text
    }
    res.status(response.status).json(payload);
  } catch (error) {
    logger.error("Python ATS parse proxy failed", {
      filename: originalName,
      error: String(error),
      source: "ats",
    });
    res.status(503).json({ error: "ATS service unavailable. Please retry shortly." });
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
