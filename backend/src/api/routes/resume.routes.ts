import { Router } from "express";
import { resumeVaultQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";
import { env } from "../../config/env.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

const router = Router();
const upload = multer({ dest: path.join(env.DATA_DIR, "uploads") });

// GET all resumes
router.get("/", (req, res) => {
  try {
    const items = resumeVaultQueries.getAll();
    res.json(items);
  } catch (error) {
    logger.error("Failed to fetch resumes from vault", { error: String(error), source: "resume_vault" });
    res.status(500).json({ error: String(error) });
  }
});

// GET resume by ID
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  try {
    const item = resumeVaultQueries.getById(id);
    if (!item) return res.status(404).json({ error: "Resume not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// GET resume's original PDF/Word file from disk
router.get("/:id/file", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  try {
    const item = resumeVaultQueries.getById(id);
    if (!item) return res.status(404).json({ error: "Resume not found" });

    const ext = path.extname(item.filename).toLowerCase();
    const filePath = path.join(env.DATA_DIR, "resumes", `resume_${id}${ext}`);

    if (fs.existsSync(filePath)) {
      if (ext === ".pdf") {
        res.setHeader("Content-Type", "application/pdf");
      } else if (ext === ".docx") {
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      } else if (ext === ".txt") {
        res.setHeader("Content-Type", "text/plain");
      }
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "Original resume file not found on disk" });
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// POST upload and parse new resume
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
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

    // Parse plain text content
    if (ext === ".txt") {
      text = fs.readFileSync(tempFilePath, "utf-8");
    } else if (ext === ".pdf") {
      const buffer = fs.readFileSync(tempFilePath);
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      text = data.text;
      await parser.destroy().catch(() => {});
    } else if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: tempFilePath });
      text = result.value;
    } else {
      fs.unlinkSync(tempFilePath);
      return res.status(400).json({ error: "Unsupported file type. Please upload a .txt, .pdf, or .docx file." });
    }

    // Determine if it should be default (if no resumes currently exist)
    const existing = resumeVaultQueries.getAll();
    const isDefault = existing.length === 0 ? 1 : 0;

    // Insert record in DB
    const dbResult = resumeVaultQueries.insert({
      filename: originalName,
      label: label,
      content: text,
      is_default: isDefault
    });

    const newId = Number(dbResult.lastInsertRowid);

    // Save the original file to data/resumes/resume_<id>.<ext>
    const finalDestDir = path.join(env.DATA_DIR, "resumes");
    if (!fs.existsSync(finalDestDir)) {
      fs.mkdirSync(finalDestDir, { recursive: true });
    }
    const finalPath = path.join(finalDestDir, `resume_${newId}${ext}`);
    fs.copyFileSync(tempFilePath, finalPath);

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    res.json({
      success: true,
      id: newId,
      filename: originalName,
      label: label,
      content: text,
      is_default: isDefault
    });
  } catch (error) {
    logger.error("Resume vault upload/parse failed", { filename: originalName, error: String(error), source: "resume_vault" });
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    res.status(500).json({ error: `Failed to upload and parse resume: ${String(error)}` });
  }
});

// POST set default resume
router.post("/:id/default", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  try {
    const item = resumeVaultQueries.getById(id);
    if (!item) return res.status(404).json({ error: "Resume not found" });

    resumeVaultQueries.setDefault(id);
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to set default resume", { id, error: String(error), source: "resume_vault" });
    res.status(500).json({ error: String(error) });
  }
});

// DELETE resume
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  try {
    const item = resumeVaultQueries.getById(id);
    if (item) {
      const ext = path.extname(item.filename).toLowerCase();
      const filePath = path.join(env.DATA_DIR, "resumes", `resume_${id}${ext}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    resumeVaultQueries.delete(id);
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete resume", { id, error: String(error), source: "resume_vault" });
    res.status(500).json({ error: String(error) });
  }
});

export default router;
