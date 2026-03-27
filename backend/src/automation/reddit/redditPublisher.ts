import { getRedditClient } from "./redditClient.js";
import { redditQueries, activityQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";

export async function publishRedditPost(dbId: number): Promise<boolean> {
  const post = redditQueries.getById(dbId);
  if (!post || post.status !== "approved" || !post.title || !post.subreddit) {
    logger.warn(`Reddit Post ${dbId} is not approved or missing data.`, { source: "reddit" });
    return false;
  }

  try {
    // @ts-ignore
    const submission = await getRedditClient().submitSelfpost({
      subredditName: post.subreddit,
      title: post.title,
      text: post.content
    });

    const now = new Date().toISOString();

    redditQueries.update(dbId, {
      status: "posted",
      posted_at: now,
      reddit_post_id: submission.name, // 't3_...' ID format
      error_message: null
    } as unknown as Partial<import("../../db/queries.js").RedditPost>);

    activityQueries.add(
      "reddit_posted",
      `Published a post to r/${post.subreddit}`,
      JSON.stringify({ dbId, redditPostId: submission.name })
    );
    
    logger.info(`Successfully posted to Reddit r/${post.subreddit}. ID: ${submission.name}`, { source: "reddit" });
    return true;

  } catch (error: any) {
    const errMsg = error.message || String(error);
    
    redditQueries.update(dbId, {
      status: "failed",
      error_message: errMsg
    } as unknown as Partial<import("../../db/queries.js").RedditPost>);

    activityQueries.add(
      "reddit_failed",
      `Failed to publish Reddit post to r/${post.subreddit}: ${errMsg}`,
      JSON.stringify({ dbId })
    );

    logger.error(`Reddit publish failed for post ${dbId}`, { error: errMsg, source: "reddit" });
    return false;
  }
}
