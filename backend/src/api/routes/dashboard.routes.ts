import { Router, Response } from "express";
import {
  companyQueries,
  postQueries,
  activityQueries,
  settingsQueries,
  twitterQueries,
  applicationQueries,
} from "../../db/queries.js";
import { mailQueue } from "../../queue/mailQueue.js";
import { isGmailConfigured } from "../../automation/coldmail/mailSender.js";
import { isWhatsAppConfigured } from "../../notifications/whatsapp.js";
import { hasValidSession } from "../../automation/linkedin/session.js";
import { env } from "../../config/env.js";
import { getEditableSetting, getWeeklyPostLabel } from "../../config/appSettings.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";

const router = Router();

// Protect all routes
router.use(requireAuth);

router.get("/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const [
      mailsSent,
      replies,
      postsCount,
      mailsToday,
      twitterPosts,
      mailsThisWeek,
      repliesThisWeek,
      savedCount,
      appliedCount,
      interviewCount,
      offerCount,
      rejectedCount
    ] = await Promise.all([
      companyQueries.countMailSent(req.user.id),
      companyQueries.countReplies(req.user.id),
      postQueries.countPosted(req.user.id),
      companyQueries.countMailsSentToday(req.user.id),
      twitterQueries.countPosted(req.user.id),
      companyQueries.countMailsSentThisWeek(req.user.id),
      companyQueries.countRepliesThisWeek(req.user.id),
      applicationQueries.countByStage(req.user.id, "saved"),
      applicationQueries.countByStage(req.user.id, "applied"),
      applicationQueries.countByStage(req.user.id, "interview"),
      applicationQueries.countByStage(req.user.id, "offer"),
      applicationQueries.countByStage(req.user.id, "rejected")
    ]);

    res.json({
      mailsSent,
      replies,
      linkedinPosts: postsCount,
      twitterPosts,
      mailsToday,
      mailsThisWeek,
      repliesThisWeek,
      replyRate: mailsSent > 0 ? Math.round((replies / mailsSent) * 100) : 0,
      maxEmailsPerDay: Number(await getEditableSetting(req.user.id, "max_emails_per_day") || env.MAX_EMAILS_PER_DAY),
      linkedinMode: "manual",
      nextWeeklyPostLabel: await getWeeklyPostLabel(req.user.id),
      savedCount,
      appliedCount,
      interviewCount,
      offerCount,
      rejectedCount,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/activity", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const activity = await activityQueries.getRecent(req.user.id, 30);
    res.json(activity);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/queue-status", async (_req, res) => {
  try {
    const [mailWaiting, mailActive] = await Promise.all([
      mailQueue.getWaitingCount(),
      mailQueue.getActiveCount(),
    ]);
    res.json({
      mailPending: mailWaiting + mailActive,
      mailProcessing: mailActive > 0,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/system-status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const [weeklyPostEnabled, dailyLinkedInDraftEnabled] = await Promise.all([
      settingsQueries.get(req.user.id, "weekly_post_enabled"),
      settingsQueries.get(req.user.id, "daily_linkedin_draft_enabled")
    ]);

    res.json({
      redis: true,
      gmail: isGmailConfigured(),
      linkedin: hasValidSession(),
      whatsapp: await isWhatsAppConfigured(req.user.id),
      weeklyPostEnabled: weeklyPostEnabled !== "false",
      dailyLinkedInDraftEnabled: dailyLinkedInDraftEnabled !== "false",
      linkedinMode: "manual",
      nextWeeklyPostLabel: await getWeeklyPostLabel(req.user.id),
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
