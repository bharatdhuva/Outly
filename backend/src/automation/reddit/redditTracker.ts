import { getRedditClient } from "./redditClient.js";
import { redditQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";

export async function fetchRedditStats() {
  logger.info("Starting daily Reddit engagement stats fetch...", { source: "reddit" });

  const recentPosts = redditQueries.getAll().filter(p => p.status === "posted" && p.reddit_post_id);

  if (recentPosts.length === 0) {
    logger.info("No posted Reddit items found to track.", { source: "reddit" });
    return;
  }

  let updatedCount = 0;

  for (const post of recentPosts) {
    try {
      // snoowrap Submission ID from submitSelfpost is something like "t3_xxxx" or just "xxxx"
      // the getSubmission method usually expects the bare ID.
      const bareId = post.reddit_post_id!.startsWith("t3_") ? post.reddit_post_id!.substring(3) : post.reddit_post_id!;
      // @ts-ignore
      const submission = await getRedditClient().getSubmission(bareId).fetch();

      redditQueries.update(post.id, {
        upvotes: submission.ups || 0,
        comments: submission.num_comments || 0,
      } as unknown as Partial<import("../../db/queries.js").RedditPost>);
      
      updatedCount++;
    } catch (e: any) {
      logger.error(`Failed to fetch reddit stats for post ${post.id}`, { source: "reddit", error: String(e) });
    }
  }

  logger.info(`Reddit stats fetch complete. Updated ${updatedCount} posts.`, { source: "reddit" });
}
