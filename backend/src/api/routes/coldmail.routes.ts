import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  companyQueries,
  activityQueries,
} from "../../db/queries.js";
import { importCompaniesFromCSV } from "../../automation/coldmail/csvParser.js";
import { scrapeCompany } from "../../automation/coldmail/companyScraper.js";
import { generateMailForCompany } from "../../automation/coldmail/mailGenerator.js";
import { mailQueue } from "../../queue/mailQueue.js";
import { env } from "../../config/env.js";

const router = Router();
const upload = multer({ dest: path.join(env.DATA_DIR, "uploads") });

// TEMP: List duplicate companies by name and email
router.get("/duplicates", (_req, res) => {
  const all = companyQueries.getAll();
  const map = new Map();
  for (const c of all) {
    const key = `${c.company_name.toLowerCase()}|${c.hr_email.toLowerCase()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(c);
  }
  const duplicates = Array.from(map.values()).filter(arr => arr.length > 1);
  res.json({ duplicates });
});

router.get("/companies", (_req, res) => {
  const companies = companyQueries.getAll();
  res.json(companies);
});

router.post("/companies", (req, res) => {
  try {
    const { company_name, website_url, hr_email } = req.body;
    const result = companyQueries.insert({
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
      error_message: null
    });
    res.json({ id: Number(result.lastInsertRowid) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/upload-csv", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const count = importCompaniesFromCSV(req.file.path);
    fs.unlinkSync(req.file.path);
    res.json({ imported: count });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/scrape/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    await scrapeCompany(id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/scrape-all", async (_req, res) => {
  const pending = companyQueries.getByStatus("pending");
  for (const c of pending) {
    await scrapeCompany(c.id);
  }
  res.json({ scraped: pending.length });
});

router.post("/generate/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const provider = (req.body.provider as "gemini" | "grok") || "gemini";
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const result = await generateMailForCompany(id, provider);
    if (!result) {
      const company = companyQueries.getById(id);
      return res.status(500).json({
        error: company?.error_message || "Generation failed",
      });
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/generate-all", async (req, res) => {
  const provider = (req.body.provider as "gemini" | "grok") || "gemini";
  const scraped = companyQueries.getByStatus("scraped");
  let count = 0;
  for (const c of scraped) {
    const r = await generateMailForCompany(c.id, provider);
    if (r) count++;
  }
  res.json({ generated: count });
});

router.patch("/companies/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
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
  companyQueries.update(id, updates as Partial<import("../../db/queries.js").Company>);
  res.json({ ok: true });
});

router.delete("/companies/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  const company = companyQueries.getById(id);
  if (!company) return res.status(404).json({ error: "Not found" });
  companyQueries.delete(id);
  res.json({ ok: true });
});

router.post("/approve/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  companyQueries.updateStatus(id, "approved");
  res.json({ ok: true });
});

router.post("/approve-all", (_req, res) => {
  const approved = companyQueries.getByStatus("mail_generated");
  for (const c of approved) {
    companyQueries.updateStatus(c.id, "approved");
  }
  res.json({ approved: approved.length });
});

router.post("/send-approved", async (_req, res) => {
  const approved = companyQueries.getByStatus("approved");
  for (const c of approved) {
    await mailQueue.add({ companyId: c.id });
  }
  res.json({ queued: approved.length });
});

router.post("/skip/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  companyQueries.updateStatus(id, "skipped");
  res.json({ ok: true });
});

export default router;
