import cron from "node-cron";
import { env } from "../config/env.js";
import { fetchAllNews } from "../automation/news/fetcher.js";
import { generateWeeklyLinkedInPost } from "../automation/news/contentGenerator.js";
import { postQueries, settingsQueries } from "../db/queries.js";
import { User as UserModel } from "../db/models.js";
import { sendWhatsApp } from "../notifications/whatsapp.js";
import { logger } from "../lib/logger.js";

/**
 * Weekly Tech Roundup — Every Monday 9:00 AM IST
 * Generates a longer weekly roundup post using the week's top tech news.
 */
export function scheduleWeeklyPost(): void {
  cron.schedule(env.WEEKLY_POST_CRON, async () => {
    try {
      const users = await UserModel.find();
      if (users.length === 0) return;

      logger.info(`Running weekly Tech Roundup LinkedIn post cron for ${users.length} users...`, { source: "cron" });

      const news = await fetchAllNews();
      if (news.length === 0) {
        logger.warn("No news fetched for weekly LinkedIn roundup", { source: "cron" });
        return;
      }

      for (const user of users) {
        const userId = user._id.toString();
        const enabled = await settingsQueries.get(userId, "weekly_post_enabled");
        if (enabled === "false") continue;

        try {
          const voiceProfile = await settingsQueries.get(userId, "linkedin_voice_profile");
          const voiceEnabled = (await settingsQueries.get(userId, "linkedin_voice_enabled")) === "true";

          const content = await generateWeeklyLinkedInPost(news, voiceProfile, voiceEnabled);
          
          const post = await postQueries.insert(userId, {
            content,
            news_sources: JSON.stringify(news.map((n) => ({ title: n.title, url: n.url, source: n.source }))),
            status: "draft",
            posted_at: null,
            linkedin_post_url: null,
          });

          await sendWhatsApp("📰 Weekly Tech Roundup ready! Review and post it from your Outly dashboard 📱", userId);
          
          logger.info("Weekly LinkedIn post generated and saved to DB", { source: "cron", postId: post.id, userId });
        } catch (err) {
          logger.error("Failed to generate weekly post for user", { error: String(err), userId, source: "cron" });
        }
      }
    } catch (e) {
      logger.error("Weekly post cron failed", { error: String(e), source: "cron" });
    }
  });
  logger.info(`Weekly post scheduled: ${env.WEEKLY_POST_CRON}`, { source: "system" });
}
