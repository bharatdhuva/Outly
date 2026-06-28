import { Router, Response } from "express";
import { settingsQueries } from "../../db/queries.js";
import { sendWhatsApp, isWhatsAppConfigured } from "../../notifications/whatsapp.js";
import { isGmailConfigured } from "../../automation/coldmail/mailSender.js";
import { hasValidSession } from "../../automation/linkedin/session.js";
import { downloadResumeToTemp } from "../../drive/googleDrive.js";
import { env } from "../../config/env.js";
import { getEditableSettings } from "../../config/appSettings.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";

const router = Router();

// Protect all routes
router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    // Load defaults and override with user-specific database settings
    const mergedSettings = await getEditableSettings(req.user.id);

    res.json({
      ...mergedSettings,
      sender_email: env.GMAIL_USER,
      gmailConfigured: isGmailConfigured(),
      linkedinSessionValid: hasValidSession(),
      whatsappConfigured: await isWhatsAppConfigured(req.user.id),
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "Missing key" });

    await settingsQueries.set(req.user.id, key, String(value ?? ""));
    return res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const handleSettingsUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ error: "Unauthorized" });
    const { settings } = req.body as {
      settings?: Record<string, string | number | boolean | null | undefined>;
    };

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ error: "Missing settings payload" });
    }

    for (const [key, value] of Object.entries(settings)) {
      if (key) {
        await settingsQueries.set(req.user.id, key, String(value ?? ""));
      }
    }

    return res.json({ ok: true });
  } catch (e: any) {
    console.error("Error updating user settings:", e);
    return res.status(500).json({ error: e?.message || String(e) || "Failed to update settings" });
  }
};

router.put("/", handleSettingsUpdate);
router.put("", handleSettingsUpdate);

router.post("/test-whatsapp", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const ok = await sendWhatsApp("JobOS test notification: all systems OK.", req.user.id);
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

router.post("/test-resume", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const path = await downloadResumeToTemp(req.user.id);
    res.json({ ok: !!path, path: path ?? undefined });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

export default router;
