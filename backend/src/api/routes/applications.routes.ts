import { Router, Response } from "express";
import { applicationQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";

const router = Router();

// Protect all routes
router.use(requireAuth);

// GET all applications for the authenticated user
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const apps = await applicationQueries.getAll(req.user.id);
    res.json(apps);
  } catch (error) {
    logger.error("Failed to fetch applications", { error: String(error), userId: req.user?.id, source: "applications" });
    res.status(500).json({ error: String(error) });
  }
});

// POST new application
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { company, role, jd_url, stage, resume_version_used, notes } = req.body;

    if (!company || !role) {
      return res.status(400).json({ error: "Company name and Role are required." });
    }

    const result = await applicationQueries.insert(req.user.id, {
      company,
      role,
      jd_url: jd_url || null,
      stage: stage || "saved",
      resume_version_used: resume_version_used || null,
      notes: notes || null,
      email_history: JSON.stringify([]),
    });

    res.json({ success: true, id: result.id });
  } catch (error) {
    logger.error("Failed to insert application", { error: String(error), userId: req.user?.id, source: "applications" });
    res.status(500).json({ error: String(error) });
  }
});

// PUT update application
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;

    // Check if application belongs to user first
    const app = await applicationQueries.getById(id, req.user.id);
    if (!app) {
      return res.status(404).json({ error: "Application not found." });
    }

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

    await applicationQueries.update(id, updates, req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Failed to update application ID ${req.params.id}`, { error: String(error), userId: req.user?.id, source: "applications" });
    res.status(500).json({ error: String(error) });
  }
});

// DELETE application
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;

    // Check if application belongs to user first
    const app = await applicationQueries.getById(id, req.user.id);
    if (!app) {
      return res.status(404).json({ error: "Application not found." });
    }

    await applicationQueries.delete(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Failed to delete application ID ${req.params.id}`, { error: String(error), userId: req.user?.id, source: "applications" });
    res.status(500).json({ error: String(error) });
  }
});

export default router;
