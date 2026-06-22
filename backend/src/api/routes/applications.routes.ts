import { Router } from "express";
import { applicationQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";

const router = Router();

// GET all applications
router.get("/", (req, res) => {
  try {
    const apps = applicationQueries.getAll();
    res.json(apps);
  } catch (error) {
    logger.error("Failed to fetch applications", { error: String(error), source: "applications" });
    res.status(500).json({ error: String(error) });
  }
});

// POST new application
router.post("/", (req, res) => {
  const { company, role, jd_url, stage, resume_version_used, notes } = req.body;

  if (!company || !role) {
    return res.status(400).json({ error: "Company name and Role are required." });
  }

  try {
    const result = applicationQueries.insert({
      company,
      role,
      jd_url: jd_url || null,
      stage: stage || "saved",
      resume_version_used: resume_version_used || null,
      notes: notes || null,
      email_history: JSON.stringify([]),
    });

    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    logger.error("Failed to insert application", { error: String(error), source: "applications" });
    res.status(500).json({ error: String(error) });
  }
});

// PUT update application
router.put("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid application ID." });

  const { company, role, jd_url, stage, resume_version_used, notes, email_history } = req.body;

  const updates: Record<string, any> = {};
  if (company !== undefined) updates.company = company;
  if (role !== undefined) updates.role = role;
  if (jd_url !== undefined) updates.jd_url = jd_url || null;
  if (stage !== undefined) updates.stage = stage;
  if (resume_version_used !== undefined) updates.resume_version_used = resume_version_used || null;
  if (notes !== undefined) updates.notes = notes || null;
  if (email_history !== undefined) {
    updates.email_history = typeof email_history === "string" ? email_history : JSON.stringify(email_history);
  }

  try {
    applicationQueries.update(id, updates);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Failed to update application ID ${id}`, { error: String(error), source: "applications" });
    res.status(500).json({ error: String(error) });
  }
});

// DELETE application
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid application ID." });

  try {
    applicationQueries.delete(id);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Failed to delete application ID ${id}`, { error: String(error), source: "applications" });
    res.status(500).json({ error: String(error) });
  }
});

export default router;
