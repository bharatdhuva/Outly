import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { generateWeeklyThread } from "../automation/twitter/tweetGenerator.js";
import { twitterQueries } from "../db/queries.js";

export function scheduleWeeklyThread() {
  cron.schedule(env.WEEKLY_THREAD_CRON || "0 19 * * 3", async () => {
    logger.info("Running Weekly Twitter Thread generation cron job...", { source: "twitter" });

    try {
      const tweetsArr = await generateWeeklyThread();
      if (!tweetsArr || tweetsArr.length === 0) {
        logger.error("Weekly thread generation returned empty.", { source: "twitter" });
        return;
      }

      // Save to DB as a JSON string to preserve the array of tweets
      const contentStr = JSON.stringify(tweetsArr);
      const result = twitterQueries.insert({
        content: contentStr,
        type: "thread",
        status: "draft",
      } as Omit<import("../db/queries.js").TwitterPost, "id" | "created_at">);

      logger.info(`Saved new weekly thread draft to DB with ID ${result.lastInsertRowid}`, { source: "twitter" });

    } catch (e: any) {
      logger.error("Failed to run weekly thread cron", { error: String(e), source: "twitter" });
    }
  });

  logger.info(`Weekly Thread Cron scheduled: ${env.WEEKLY_THREAD_CRON || "0 19 * * 3"}`, { source: "system" });
}
