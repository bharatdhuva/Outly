import cron from "node-cron";
import { env } from "../config/env.js";
import { fetchAllNews } from "../automation/news/fetcher.js";
import { generateLinkedInDraft } from "../automation/news/contentGenerator.js";
import { postQueries, settingsQueries } from "../db/queries.js";
import { User as UserModel } from "../db/models.js";
import { sendWhatsApp } from "../notifications/whatsapp.js";
import { logger } from "../lib/logger.js";

/**
 * v2.3: Daily LinkedIn Draft Generator
 * Runs every day at 8:00 AM IST (before morning briefing kicks in).
 * Generates a fresh LinkedIn draft using today's tech news, saves to DB.
 */
export function scheduleDailyLinkedInDraft(): void {
  // Run at 8:00 AM IST daily (DAILY_LINKEDIN_DRAFT_CRON or default)
  const cronExpr = process.env.DAILY_LINKEDIN_DRAFT_CRON ?? "30 7 * * *"; // 7:30 AM so draft is ready before 8 AM
  
  cron.schedule(cronExpr, async () => {
    try {
      const users = await UserModel.find();
      if (users.length === 0) return;

      logger.info(`Running daily LinkedIn draft generation for ${users.length} users...`, { source: "cron" });
      
      const news = await fetchAllNews();
      if (news.length === 0) {
        logger.warn("No news fetched for LinkedIn draft", { source: "cron" });
        return;
      }

      for (const user of users) {
        const userId = user._id.toString();
        const enabled = await settingsQueries.get(userId, "daily_linkedin_draft_enabled");
        if (enabled === "false") continue;

        try {
          const voiceProfile = await settingsQueries.get(userId, "linkedin_voice_profile");
          const voiceEnabled = (await settingsQueries.get(userId, "linkedin_voice_enabled")) === "true";

          const content = await generateLinkedInDraft(news, voiceProfile, voiceEnabled);
          
          const post = await postQueries.insert(userId, {
            content,
            news_sources: JSON.stringify(news.map((n) => ({ title: n.title, url: n.url, source: n.source }))),
            status: "draft",
            posted_at: null,
            linkedin_post_url: null,
          });

          // Light WhatsApp notification
          await sendWhatsApp("🔵 Aaj ka LinkedIn draft ready hai! Outly dashboard check karo 📱", userId);

          logger.info("Daily LinkedIn draft generated and saved to DB", { source: "cron", postId: post.id, userId });
        } catch (err) {
          logger.error("Failed to generate LinkedIn draft for user", { error: String(err), userId, source: "cron" });
        }
      }
    } catch (e) {
      logger.error("Daily LinkedIn draft cron failed", { error: String(e), source: "cron" });
    }
  });

  logger.info(`Daily LinkedIn draft scheduled: ${cronExpr}`, { source: "system" });
}
