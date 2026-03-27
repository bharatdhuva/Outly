import { getTwitterClientRw } from "./twitterClient.js";
import { twitterQueries } from "../../db/queries.js";
import { activityQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";

export async function publishTwitterPost(dbId: number): Promise<boolean> {
  const post = twitterQueries.getById(dbId);
  if (!post || post.status !== "approved") {
    logger.warn(`Twitter Post ${dbId} is not approved or not found.`, { source: "twitter" });
    return false;
  }

  try {
    let response;
    
    if (post.type === "thread") {
      // Content is expected to be a JSON array of strings
      const tweets: string[] = JSON.parse(post.content);
      response = await getTwitterClientRw().v2.tweetThread(tweets);
    } else {
      // Single tweet
      response = await getTwitterClientRw().v2.tweet(post.content);
    }

    // Extract the ID of the first (or only) tweet
    const tweetId = Array.isArray(response) ? response[0].data.id : response.data.id;
    const now = new Date().toISOString();

    twitterQueries.update(dbId, {
      status: "posted",
      posted_at: now,
      twitter_post_id: tweetId,
      error_message: null
    } as unknown as Partial<import("../../db/queries.js").TwitterPost>);

    activityQueries.add(
      "twitter_posted",
      `Published a Twitter ${post.type}`,
      JSON.stringify({ dbId, tweetId })
    );
    
    logger.info(`Successfully posted to Twitter. ID: ${tweetId}`, { source: "twitter" });
    return true;

  } catch (error: any) {
    const errMsg = error.message || String(error);
    
    twitterQueries.update(dbId, {
      status: "failed",
      error_message: errMsg
    } as unknown as Partial<import("../../db/queries.js").TwitterPost>);

    activityQueries.add(
      "twitter_failed",
      `Failed to publish Twitter ${post.type}: ${errMsg}`,
      JSON.stringify({ dbId })
    );

    logger.error(`Twitter publish failed for post ${dbId}`, { error: errMsg, source: "twitter" });
    return false;
  }
}
