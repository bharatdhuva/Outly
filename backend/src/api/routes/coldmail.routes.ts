import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  companyQueries,
  activityQueries,
  Company,
} from "../../db/queries.js";
import { importCompaniesFromCSV } from "../../automation/coldmail/csvParser.js";
import { scrapeCompany } from "../../automation/coldmail/companyScraper.js";
import { generateMailForCompany } from "../../automation/coldmail/mailGenerator.js";
import { mailQueue } from "../../queue/mailQueue.js";
import { env } from "../../config/env.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";
import { checkColdMailLimit } from "../../middleware/limits.js";

const router = Router();
const uploadDir = path.join(env.DATA_DIR, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// Protect all routes
router.use(requireAuth);

// TEMP: List duplicate companies by name and email
router.get("/duplicates", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const all = await companyQueries.getAll(req.user.id);
    const map = new Map();
    for (const c of all) {
      const key = `${c.company_name.toLowerCase()}|${c.hr_email.toLowerCase()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    }
    const duplicates = Array.from(map.values()).filter(arr => arr.length > 1);
    res.json({ duplicates });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/companies", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const companies = await companyQueries.getAll(req.user.id);
    res.json(companies);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/companies", checkColdMailLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { company_name, website_url, hr_email } = req.body;
    
    if (!company_name || !hr_email) {
      return res.status(400).json({ error: "Company name and HR email are required." });
    }

    const result = await companyQueries.insert(req.user.id, {
      company_name,
      website_url: website_url || null,
      hr_email,
      role: "Software Development Engineer", // default
      linkedin_url: null,
      target_person_name: null,
      target_person_role: null,
      key_skills: null,
      experience_level: null,
      sender_name: null,
      sender_location: null,
      status: "pending",
      scraped_context: null,
      generated_subject: null,
      generated_mail: null,
      personalization_hook: null,
      sent_at: null,
      reply_detected_at: null,
      followup_sent_at: null,
      followup_status: null,
      error_message: null,
      generated_variants_json: null
    });
    
    res.json({ id: result.id });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/upload-csv", upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  if (!req.user) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const count = await importCompaniesFromCSV(req.file.path, req.user.id);
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.json({ imported: count });
  } catch (e) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: String(e) });
  }
});

router.post("/scrape/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;
    const company = await companyQueries.getById(id, req.user.id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    await scrapeCompany(id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/scrape-all", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const pending = await companyQueries.getByStatus("pending", req.user.id);
    for (const c of pending) {
      await scrapeCompany(c.id);
    }
    res.json({ scraped: pending.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/generate/:id", checkColdMailLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;
    const company = await companyQueries.getById(id, req.user.id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    const provider = (req.body.provider as "gemini" | "grok") || "grok";
    const result = await generateMailForCompany(id, provider);
    if (!result) {
      const updated = await companyQueries.getById(id, req.user.id);
      return res.status(500).json({
        error: updated?.error_message || "Generation failed",
      });
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/generate-all", checkColdMailLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const provider = (req.body.provider as "gemini" | "grok") || "grok";
    const scraped = await companyQueries.getByStatus("scraped", req.user.id);
    let count = 0;
    for (const c of scraped) {
      const r = await generateMailForCompany(c.id, provider);
      if (r) count++;
    }
    res.json({ generated: count });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.patch("/companies/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;
    const company = await companyQueries.getById(id, req.user.id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    const allowed = [
      "status", "generated_subject", "generated_mail", "personalization_hook",
      "company_name", "role", "hr_email", "website_url", "target_person_name",
      "target_person_role", "key_skills", "experience_level",
      "sender_name", "sender_location",
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    await companyQueries.update(id, updates as Partial<Company>, req.user.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete("/companies/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;
    const company = await companyQueries.getById(id, req.user.id);
    if (!company) return res.status(404).json({ error: "Not found" });
    
    await companyQueries.delete(id, req.user.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/approve/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;
    const company = await companyQueries.getById(id, req.user.id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    await companyQueries.updateStatus(id, "approved", {}, req.user.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/approve-all", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const approved = await companyQueries.getByStatus("mail_generated", req.user.id);
    for (const c of approved) {
      await companyQueries.updateStatus(c.id, "approved", {}, req.user.id);
    }
    res.json({ approved: approved.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/send-approved", checkColdMailLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const approved = await companyQueries.getByStatus("approved", req.user.id);
    for (const c of approved) {
      await mailQueue.add({ companyId: c.id });
    }
    res.json({ queued: approved.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/skip/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;
    const company = await companyQueries.getById(id, req.user.id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    await companyQueries.updateStatus(id, "skipped", {}, req.user.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
