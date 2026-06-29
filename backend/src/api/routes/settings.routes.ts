import { Router, Response } from "express";
import { settingsQueries } from "../../db/queries.js";
import { sendWhatsApp, isWhatsAppConfigured } from "../../notifications/whatsapp.js";
import { isGmailConfigured } from "../../automation/coldmail/mailSender.js";
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
      sender_email: env.GMAIL_USER || req.user.email || "",
      gmailConfigured: isGmailConfigured(),
      whatsappConfigured: await isWhatsAppConfigured(req.user.id),
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

const handleSettingsUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ error: "Unauthorized" });
    
    // Support both { settings: { ... } } and direct key/value or key-value pair objects
    let targetSettings: Record<string, any> = {};
    if (req.body && typeof req.body.settings === "object" && req.body.settings !== null) {
      targetSettings = req.body.settings;
    } else if (req.body && typeof req.body.key === "string") {
      targetSettings[req.body.key] = req.body.value;
    } else if (req.body && typeof req.body === "object") {
      targetSettings = req.body;
    }

    for (const [key, value] of Object.entries(targetSettings)) {
      if (key && key !== "sender_email" && key !== "gmailConfigured" && key !== "whatsappConfigured") {
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
router.post("/", handleSettingsUpdate);
router.post("", handleSettingsUpdate);

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
