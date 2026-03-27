import cron from "node-cron";
import { fetchRedditStats } from "../automation/reddit/redditTracker.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

export function scheduleRedditTracker() {
  if (!env.REDDIT_CLIENT_ID) return;

  // Run at 11:45 PM every day to update Reddit stats
  cron.schedule("45 23 * * *", async () => {
    logger.info("Running Reddit Tracker Cron Job...", { source: "reddit" });
    await fetchRedditStats();
  });

  logger.info("Reddit Tracker Cron scheduled: 45 23 * * *", { source: "system" });
}
