import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { generateDailyTweet } from "../automation/twitter/tweetGenerator.js";
import { twitterQueries } from "../db/queries.js";
import { requestApproval } from "../approval/approvalManager.js";

export function scheduleDailyTweet() {
  cron.schedule(env.DAILY_TWEET_CRON || "0 8 * * 1-5", async () => {
    logger.info("Running Daily Tweet generation cron job...", { source: "twitter" });

    try {
      const content = await generateDailyTweet();
      if (!content) {
        logger.error("Daily tweet generation returned empty.", { source: "twitter" });
        return;
      }

      // Save to DB
      const result = twitterQueries.insert({
        content: content,
        type: "single",
        status: "draft",
      } as Omit<import("../db/queries.js").TwitterPost, "id" | "created_at">);

      await requestApproval('twitter', result.lastInsertRowid as number, content);
      
      logger.info(`Queued new daily tweet for approval with DB ID ${result.lastInsertRowid}`, { source: "twitter" });

    } catch (e: any) {
      logger.error("Failed to run daily tweet cron", { error: String(e), source: "twitter" });
    }
  });

  logger.info(`Daily Tweet Cron scheduled: ${env.DAILY_TWEET_CRON || "0 8 * * 1-5"}`, { source: "system" });
}
