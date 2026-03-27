import cron from "node-cron";
import { env } from "../config/env.js";
import { fetchAllNews } from "../automation/news/fetcher.js";
import { generateWeeklyLinkedInPost } from "../automation/news/contentGenerator.js";
import { postQueries, settingsQueries } from "../db/queries.js";
import { requestApproval } from "../approval/approvalManager.js";
import { sendWhatsApp } from "../notifications/whatsapp.js";
import { logger } from "../lib/logger.js";

/**
 * Weekly Tech Roundup — Every Monday 9:00 AM IST
 * Generates a longer weekly roundup post using the week's top tech news.
 * v2.3: Uses requestApproval which treats LinkedIn as manual-post only.
 */
export function scheduleWeeklyPost(): void {
  cron.schedule(env.WEEKLY_POST_CRON, async () => {
    const enabled = settingsQueries.get("weekly_post_enabled");
    if (enabled === "false") return;

    try {
      logger.info("Generating weekly Tech Roundup LinkedIn post...", { source: "cron" });
      
      const news = await fetchAllNews();
      const content = await generateWeeklyLinkedInPost(news);
      
      const post = postQueries.insert({
        content,
        news_sources: JSON.stringify(news.map((n) => ({ title: n.title, url: n.url, source: n.source }))),
        status: "draft",
        posted_at: null,
        linkedin_post_url: null,
      });
      const postId = (post as { lastInsertRowid: number }).lastInsertRowid;

      // v2.3: This will create LinkedIn manual-post approval (with Copy button)
      await requestApproval('linkedin', postId, content);

      await sendWhatsApp("📰 Weekly Tech Roundup ready! Check Telegram for preview 📱");
      
      logger.info("Weekly LinkedIn post generated and sent for approval", { source: "cron" });
    } catch (e) {
      logger.error("Weekly post cron failed", { error: String(e), source: "cron" });
    }
  });
  logger.info(`Weekly post scheduled: ${env.WEEKLY_POST_CRON}`, { source: "system" });
}
