import { Router } from "express";
import { settingsQueries } from "../../db/queries.js";
import { sendWhatsApp, isWhatsAppConfigured } from "../../notifications/whatsapp.js";
import { isGmailConfigured } from "../../automation/coldmail/mailSender.js";
import { hasValidSession } from "../../automation/linkedin/session.js";
import { downloadResumeToTemp } from "../../drive/googleDrive.js";
import { env } from "../../config/env.js";
import { getEditableSettings } from "../../config/appSettings.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    ...getEditableSettings(),
    sender_email: env.GMAIL_USER,
    gmailConfigured: isGmailConfigured(),
    linkedinSessionValid: hasValidSession(),
    whatsappConfigured: isWhatsAppConfigured(),
  });
});

router.post("/", (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: "Missing key" });
  settingsQueries.set(key, String(value ?? ""));
  return res.json({ ok: true });
});

router.put("/", (req, res) => {
  const { settings } = req.body as {
    settings?: Record<string, string | number | boolean | null | undefined>;
  };

  if (!settings || typeof settings !== "object") {
    return res.status(400).json({ error: "Missing settings payload" });
  }

  for (const [key, value] of Object.entries(settings)) {
    settingsQueries.set(key, String(value ?? ""));
  }

  return res.json({ ok: true });
});

router.post("/test-whatsapp", async (_req, res) => {
  const ok = await sendWhatsApp("JobOS test notification: all systems OK.");
  res.json({ ok });
});

router.post("/test-resume", async (_req, res) => {
  try {
    const path = await downloadResumeToTemp();
    res.json({ ok: !!path, path: path ?? undefined });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

export default router;
