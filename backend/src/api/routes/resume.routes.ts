import { Router } from "express";
import { resumeVaultQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";

const router = Router();

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

// POST new resume
router.post("/", (req, res) => {
  const { filename, label, content, is_default } = req.body;

  if (!filename || !label) {
    return res.status(400).json({ error: "Filename and label are required." });
  }

  try {
    const result = resumeVaultQueries.insert({
      filename,
      label,
      content: content || "",
      is_default: is_default ? 1 : 0
    });
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    logger.error("Failed to insert resume into vault", { error: String(error), source: "resume_vault" });
    res.status(500).json({ error: String(error) });
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
    resumeVaultQueries.delete(id);
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete resume", { id, error: String(error), source: "resume_vault" });
    res.status(500).json({ error: String(error) });
  }
});

export default router;
