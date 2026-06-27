import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { generateDailyTweet } from "../automation/twitter/tweetGenerator.js";
import { twitterQueries, settingsQueries } from "../db/queries.js";
import { User as UserModel } from "../db/models.js";

export function scheduleDailyTweet() {
  cron.schedule(env.DAILY_TWEET_CRON || "0 8 * * 1-5", async () => {
    try {
      const users = await UserModel.find();
      if (users.length === 0) return;

      logger.info(`Running Daily Tweet generation cron job for ${users.length} users...`, { source: "twitter" });

      for (const user of users) {
        const userId = user._id.toString();
        
        try {
          const voiceProfile = await settingsQueries.get(userId, "twitter_voice_profile");
          const voiceEnabled = (await settingsQueries.get(userId, "twitter_voice_enabled")) === "true";

          const content = await generateDailyTweet(undefined, voiceProfile, voiceEnabled);
          if (!content) {
            logger.error("Daily tweet generation returned empty.", { source: "twitter", userId });
            continue;
          }

          // Save to DB
          const result = await twitterQueries.insert(userId, {
            content: content,
            type: "single",
            status: "draft",
            posted_at: null,
            twitter_post_id: null,
            impressions: 0,
            likes: 0,
            replies: 0,
            error_message: null
          });

          logger.info(`Saved new daily tweet draft to DB with ID ${result.id}`, { source: "twitter", userId });
        } catch (err) {
          logger.error("Failed to run daily tweet for user", { error: String(err), userId, source: "twitter" });
        }
      }
    } catch (e: any) {
      logger.error("Failed to run daily tweet cron", { error: String(e), source: "twitter" });
    }
  });

  logger.info(`Daily Tweet Cron scheduled: ${env.DAILY_TWEET_CRON || "0 8 * * 1-5"}`, { source: "system" });
}
