import { Router } from "express";
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

const router = Router();

router.get("/stats", (_req, res) => {
  const mailsSent = companyQueries.countMailSent();
  const replies = companyQueries.countReplies();
  const postsCount = postQueries.countPosted();
  const mailsToday = companyQueries.countMailsSentToday();
  const twitterPosts = twitterQueries.countPosted();
  const mailsThisWeek = companyQueries.countMailsSentThisWeek();
  const repliesThisWeek = companyQueries.countRepliesThisWeek();

  const savedCount = applicationQueries.countByStage("saved");
  const appliedCount = applicationQueries.countByStage("applied");
  const interviewCount = applicationQueries.countByStage("interview");
  const offerCount = applicationQueries.countByStage("offer");
  const rejectedCount = applicationQueries.countByStage("rejected");

  res.json({
    mailsSent,
    replies,
    linkedinPosts: postsCount,
    twitterPosts,
    mailsToday,
    mailsThisWeek,
    repliesThisWeek,
    replyRate: mailsSent > 0 ? Math.round((replies / mailsSent) * 100) : 0,
    maxEmailsPerDay: Number(getEditableSetting("max_emails_per_day") || env.MAX_EMAILS_PER_DAY),
    linkedinMode: "manual",
    nextWeeklyPostLabel: getWeeklyPostLabel(),
    savedCount,
    appliedCount,
    interviewCount,
    offerCount,
    rejectedCount,
  });
});

router.get("/activity", (_req, res) => {
  const activity = activityQueries.getRecent(30);
  res.json(activity);
});

router.get("/queue-status", async (_req, res) => {
  const [mailWaiting, mailActive] = await Promise.all([
    mailQueue.getWaitingCount(),
    mailQueue.getActiveCount(),
  ]);
  res.json({
    mailPending: mailWaiting + mailActive,
    mailProcessing: mailActive > 0,
  });
});

router.get("/system-status", (_req, res) => {
  res.json({
    redis: true,
    gmail: isGmailConfigured(),
    linkedin: hasValidSession(),
    whatsapp: isWhatsAppConfigured(),
    telegram: !!env.TELEGRAM_BOT_TOKEN,
    weeklyPostEnabled: settingsQueries.get("weekly_post_enabled") !== "false",
    dailyLinkedInDraftEnabled: settingsQueries.get("daily_linkedin_draft_enabled") !== "false",
    linkedinMode: "manual",
    nextWeeklyPostLabel: getWeeklyPostLabel(),
  });
});

export default router;
