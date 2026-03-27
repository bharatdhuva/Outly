import cron from "node-cron";
import { fetchTweetStats } from "../automation/twitter/tweetTracker.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

export function scheduleTweetTracker() {
  if (!env.TWITTER_API_KEY) return;

  // Run at 11:30 PM every day to get the final stats for the day
  cron.schedule("30 23 * * *", async () => {
    logger.info("Running Tweet Tracker Cron Job...", { source: "twitter" });
    await fetchTweetStats();
  });

  logger.info("Tweet Tracker Cron scheduled: 30 23 * * *", { source: "system" });
}
