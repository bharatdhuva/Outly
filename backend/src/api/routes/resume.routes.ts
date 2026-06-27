import { Router, Response } from "express";
import { resumeVaultQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";
import { env } from "../../config/env.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";
import { checkResumeLimit } from "../../middleware/limits.js";
import { uploadToCloudinary } from "../../lib/cloudinary.js";
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
// Do not require `pdf-parse` at module-load time — it pulls native canvas bindings
// that are not available in some serverless environments (causes startup crash).
// We'll load it lazily inside handlers and fail gracefully if it's not present.
let mammoth: any;
try {
  mammoth = require("mammoth");
} catch (e) {
  mammoth = null;
}

const router = Router();
const uploadDir = path.join(env.DATA_DIR, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// Protect all routes with authentication
router.use(requireAuth);

// GET all resumes for the authenticated user
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const items = await resumeVaultQueries.getAll(req.user.id);
    res.json(items);
  } catch (error) {
    logger.error("Failed to fetch resumes from vault", { error: String(error), userId: req.user?.id, source: "resume_vault" });
    res.status(500).json({ error: String(error) });
  }
});

// GET resume by ID
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const item = await resumeVaultQueries.getById(req.params.id as string, req.user.id);
    if (!item) return res.status(404).json({ error: "Resume not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET resume's original PDF/Word file (from Cloudinary or local disk)
router.get("/:id/file", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const item = await resumeVaultQueries.getById(req.params.id as string, req.user.id);
    if (!item) return res.status(404).json({ error: "Resume not found" });

    const ext = path.extname(item.filename).toLowerCase();

    // Set appropriate content type header for clean browser rendering
    if (ext === ".pdf") {
      res.setHeader("Content-Type", "application/pdf");
    } else if (ext === ".docx") {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    } else if (ext === ".txt") {
      res.setHeader("Content-Type", "text/plain");
    }

    // If Cloudinary URL is stored, proxy stream it to bypass cross-origin / 401 restrictions
    if (item.cloudinaryUrl) {
      try {
        const streamRes = await axios.get(item.cloudinaryUrl, { responseType: "stream" });
        return streamRes.data.pipe(res);
      } catch (streamErr) {
        logger.warn("Failed to stream from Cloudinary, attempting local disk fallback", { error: String(streamErr) });
      }
    }

    // Fallback: local disk
    const filePath = path.join(env.DATA_DIR, "resumes", `resume_${item.id}${ext}`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "Original resume file not found on disk or cloud" });
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// POST upload and parse new resume
router.post("/upload", upload.single("file"), checkResumeLimit, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  if (!req.user) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { label } = req.body;
  if (!label) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Label is required." });
  }

  const tempFilePath = req.file.path;
  const originalName = req.file.originalname;
  const ext = path.extname(originalName).toLowerCase();

  try {
    let text = "";

    // Parse text content based on file extension
    if (ext === ".txt") {
      text = fs.readFileSync(tempFilePath, "utf-8");
    } else if (ext === ".pdf") {
      try {
        if (!(globalThis as any).DOMMatrix) {
          try { (globalThis as any).DOMMatrix = require("dommatrix"); } catch (_) {}
        }
        const pdfModule = require("pdf-parse");
        const buffer = fs.readFileSync(tempFilePath);
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
        logger.error("PDF parsing failed in resume route", { error: e?.message || String(e), source: "resume_vault" });
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        return res.status(500).json({ error: e?.message || "Failed to parse PDF document." });
      }
    } else if (ext === ".docx") {
      if (!mammoth) {
        mammoth = require("mammoth");
      }
      const result = await mammoth.extractRawText({ path: tempFilePath });
      text = result.value;
    } else {
      fs.unlinkSync(tempFilePath);
      return res.status(400).json({ error: "Unsupported file type. Please upload a .txt, .pdf, or .docx file." });
    }

    // Upload to Cloudinary (optional)
    const cloudinaryUrl = await uploadToCloudinary(tempFilePath, `outly/resumes/${req.user.id}`);

    // Determine if it should be default (if no resumes currently exist for this user)
    const existing = await resumeVaultQueries.getAll(req.user.id);
    const isDefault = existing.length === 0 ? 1 : 0;

    // Insert record in DB
    const dbResult = await resumeVaultQueries.insert(req.user.id, {
      filename: originalName,
      label: label,
      content: text,
      is_default: isDefault,
      cloudinaryUrl: cloudinaryUrl || undefined
    });

    // Save local copy only if Cloudinary upload didn't yield a URL (fallback)
    if (!cloudinaryUrl) {
      const finalDestDir = path.join(env.DATA_DIR, "resumes");
      if (!fs.existsSync(finalDestDir)) {
        fs.mkdirSync(finalDestDir, { recursive: true });
      }
      const finalPath = path.join(finalDestDir, `resume_${dbResult.id}${ext}`);
      fs.copyFileSync(tempFilePath, finalPath);
    }

    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    res.json({
      success: true,
      id: dbResult.id,
      filename: dbResult.filename,
      label: dbResult.label,
      content: dbResult.content,
      is_default: dbResult.is_default,
      cloudinaryUrl: dbResult.cloudinaryUrl
    });
  } catch (error) {
    logger.error("Resume vault upload/parse failed", { filename: originalName, userId: req.user.id, error: String(error), source: "resume_vault" });
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    res.status(500).json({ error: `Failed to upload and parse resume: ${String(error)}` });
  }
});

// POST set default resume
router.post("/:id/default", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const item = await resumeVaultQueries.getById(req.params.id as string, req.user.id);
    if (!item) return res.status(404).json({ error: "Resume not found" });

    await resumeVaultQueries.setDefault(req.params.id as string, req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to set default resume", { id: req.params.id, userId: req.user?.id, error: String(error), source: "resume_vault" });
    res.status(500).json({ error: String(error) });
  }
});

// DELETE resume
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const item = await resumeVaultQueries.getById(req.params.id as string, req.user.id);
    if (item) {
      // If it has local file, clean it up
      const ext = path.extname(item.filename).toLowerCase();
      const filePath = path.join(env.DATA_DIR, "resumes", `resume_${item.id}${ext}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await resumeVaultQueries.delete(req.params.id as string, req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete resume", { id: req.params.id, userId: req.user?.id, error: String(error), source: "resume_vault" });
    res.status(500).json({ error: String(error) });
  }
});

// PUT update resume details (like label or tags)
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { label } = req.body;
    if (!label) return res.status(400).json({ error: "Label is required" });

    const updated = await resumeVaultQueries.update(req.params.id as string, req.user.id, { label });
    if (!updated) return res.status(404).json({ error: "Resume not found" });

    res.json(updated);
  } catch (error) {
    logger.error("Failed to update resume details", { id: req.params.id, userId: req.user?.id, error: String(error), source: "resume_vault" });
    res.status(500).json({ error: String(error) });
  }
});

export default router;
