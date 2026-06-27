import cron from "node-cron";
import { fetchAllNews } from "../automation/news/fetcher.js";
import { generateLinkedInDraft, generateTwitterDraft } from "../automation/news/contentGenerator.js";
import { logger } from "../lib/logger.js";
import { postQueries, twitterQueries, settingsQueries } from "../db/queries.js";
import { User as UserModel } from "../db/models.js";

/**
 * Runs twice a day to generate separate social media drafts.
 * Saves raw drafts to DB directly for in-app review.
 */
export function scheduleSocialDrafts(): void {
  // 10:40 AM and 10:40 PM (22:40) every day test
  cron.schedule("40 10,22 * * *", async () => {
    try {
      const users = await UserModel.find();
      if (users.length === 0) return;

      logger.info(`Running daily social media drafts cron for ${users.length} users...`, { source: "cron" });
      const news = await fetchAllNews();
      if (news.length === 0) {
        logger.warn("No news fetched for social media drafts", { source: "cron" });
        return;
      }

      for (const user of users) {
        const userId = user._id.toString();

        try {
          const linkedinVoiceProfile = await settingsQueries.get(userId, "linkedin_voice_profile");
          const linkedinVoiceEnabled = (await settingsQueries.get(userId, "linkedin_voice_enabled")) === "true";

          const twitterVoiceProfile = await settingsQueries.get(userId, "twitter_voice_profile");
          const twitterVoiceEnabled = (await settingsQueries.get(userId, "twitter_voice_enabled")) === "true";

          const linkedinDraft = await generateLinkedInDraft(news, linkedinVoiceProfile, linkedinVoiceEnabled);
          const twitterContent = await generateTwitterDraft(news, twitterVoiceProfile, twitterVoiceEnabled);

          // Save LinkedIn
          await postQueries.insert(userId, { 
            content: linkedinDraft, 
            news_sources: JSON.stringify(news.map(n => ({ title: n.title, url: n.url }))), 
            status: 'draft', 
            posted_at: null, 
            linkedin_post_url: null 
          });

          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Save Twitter
          await twitterQueries.insert(userId, { 
            content: twitterContent, 
            type: 'single',
            status: 'draft', 
            posted_at: null,
            twitter_post_id: null,
            impressions: 0,
            likes: 0,
            replies: 0,
            error_message: null
          });
          
          logger.info("Social media drafts generated and saved to DB for user", { source: "cron", userId });
        } catch (err) {
          logger.error("Failed to generate social drafts for user", { error: String(err), userId, source: "cron" });
        }
      }
    } catch (e) {
      logger.error("Social media drafts cron failed", { error: String(e), source: "cron" });
    }
  });
  logger.info("Social Drafts scheduled: 40 10,22 * * *", { source: "system" });
}
