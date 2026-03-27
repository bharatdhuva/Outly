import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { generateRedditPost } from "../automation/reddit/redditGenerator.js";
import { redditQueries } from "../db/queries.js";
import { requestApproval } from "../approval/approvalManager.js";

export function scheduleWeeklyRedditPost() {
  if (!env.REDDIT_CLIENT_ID) return;

  // Fridays at 10 AM by default
  cron.schedule(env.WEEKLY_REDDIT_CRON || "0 10 * * 5", async () => {
    logger.info("Running Weekly Reddit Post generation cron job...", { source: "reddit" });

    try {
      // Pick a default native subreddit or pull from settings if needed
      const subreddit = "developersIndia"; 

      const postObj = await generateRedditPost(subreddit);
      if (!postObj || !postObj.title || !postObj.content) {
        logger.error("Weekly Reddit post generation returned empty.", { source: "reddit" });
        return;
      }

      // Save to DB
      const result = redditQueries.insert({
        subreddit,
        title: postObj.title,
        content: postObj.content,
        status: "draft",
      } as Omit<import("../db/queries.js").RedditPost, "id" | "created_at">);

      await requestApproval('reddit', result.lastInsertRowid as number, `[r/${subreddit}] ${postObj.title}\n\n${postObj.content}`);
      logger.info(`Queued new weekly Reddit post (r/${subreddit}) for approval with DB ID ${result.lastInsertRowid}`, { source: "reddit" });

    } catch (e: any) {
      logger.error("Failed to run weekly reddit cron", { error: String(e), source: "reddit" });
    }
  });

  logger.info(`Weekly Reddit Cron scheduled: ${env.WEEKLY_REDDIT_CRON || "0 10 * * 5"}`, { source: "system" });
}
