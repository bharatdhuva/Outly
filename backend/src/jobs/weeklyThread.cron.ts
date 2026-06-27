import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { generateWeeklyThread } from "../automation/twitter/tweetGenerator.js";
import { twitterQueries, settingsQueries } from "../db/queries.js";
import { User as UserModel } from "../db/models.js";

export function scheduleWeeklyThread() {
  cron.schedule(env.WEEKLY_THREAD_CRON || "0 19 * * 3", async () => {
    try {
      const users = await UserModel.find();
      if (users.length === 0) return;

      logger.info(`Running Weekly Twitter Thread generation cron job for ${users.length} users...`, { source: "twitter" });

      for (const user of users) {
        const userId = user._id.toString();

        try {
          const voiceProfile = await settingsQueries.get(userId, "twitter_voice_profile");
          const voiceEnabled = (await settingsQueries.get(userId, "twitter_voice_enabled")) === "true";

          const tweetsArr = await generateWeeklyThread(undefined, voiceProfile, voiceEnabled);
          if (!tweetsArr || tweetsArr.length === 0) {
            logger.error("Weekly thread generation returned empty.", { source: "twitter", userId });
            continue;
          }

          // Save to DB as a JSON string to preserve the array of tweets
          const contentStr = JSON.stringify(tweetsArr);
          const result = await twitterQueries.insert(userId, {
            content: contentStr,
            type: "thread",
            status: "draft",
            posted_at: null,
            twitter_post_id: null,
            impressions: 0,
            likes: 0,
            replies: 0,
            error_message: null
          });

          logger.info(`Saved new weekly thread draft to DB with ID ${result.id}`, { source: "twitter", userId });
        } catch (err) {
          logger.error("Failed to run weekly thread for user", { error: String(err), userId, source: "twitter" });
        }
      }
    } catch (e: any) {
      logger.error("Failed to run weekly thread cron", { error: String(e), source: "twitter" });
    }
  });

  logger.info(`Weekly Thread Cron scheduled: ${env.WEEKLY_THREAD_CRON || "0 19 * * 3"}`, { source: "system" });
}
