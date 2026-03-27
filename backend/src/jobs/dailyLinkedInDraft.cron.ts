import cron from "node-cron";
import { env } from "../config/env.js";
import { fetchAllNews } from "../automation/news/fetcher.js";
import { generateLinkedInDraft } from "../automation/news/contentGenerator.js";
import { postQueries, settingsQueries } from "../db/queries.js";
import { requestApproval } from "../approval/approvalManager.js";
import { sendWhatsApp } from "../notifications/whatsapp.js";
import { logger } from "../lib/logger.js";

/**
 * v2.3: Daily LinkedIn Draft Generator
 * Runs every day at 8:00 AM IST (before morning briefing kicks in).
 * Generates a fresh LinkedIn draft using today's tech news, saves to DB,
 * and sends rich Telegram approval message with Copy button.
 */
export function scheduleDailyLinkedInDraft(): void {
  // Run at 8:00 AM IST daily (DAILY_LINKEDIN_DRAFT_CRON or default)
  const cronExpr = process.env.DAILY_LINKEDIN_DRAFT_CRON ?? "30 7 * * *"; // 7:30 AM so draft is ready before 8 AM briefing
  
  cron.schedule(cronExpr, async () => {
    const enabled = settingsQueries.get("daily_linkedin_draft_enabled");
    if (enabled === "false") return;

    try {
      logger.info("Generating daily LinkedIn draft...", { source: "cron" });
      
      const news = await fetchAllNews();
      if (news.length === 0) {
        logger.warn("No news fetched for LinkedIn draft", { source: "cron" });
        return;
      }

      const content = await generateLinkedInDraft(news);
      
      const post = postQueries.insert({
        content,
        news_sources: JSON.stringify(news.map((n) => ({ title: n.title, url: n.url, source: n.source }))),
        status: "draft",
        posted_at: null,
        linkedin_post_url: null,
      });
      const postId = Number((post as { lastInsertRowid: number }).lastInsertRowid);

      // Send rich Telegram approval with Copy button
      await requestApproval("linkedin", postId, content);

      // Light WhatsApp notification
      await sendWhatsApp("🔵 Aaj ka LinkedIn draft ready hai! Telegram check karo 📱");

      logger.info("Daily LinkedIn draft generated and sent for approval", { source: "cron" });
    } catch (e) {
      logger.error("Daily LinkedIn draft cron failed", { error: String(e), source: "cron" });
    }
  });

  logger.info(`Daily LinkedIn draft scheduled: ${cronExpr}`, { source: "system" });
}
