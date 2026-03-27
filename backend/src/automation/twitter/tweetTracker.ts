import { getTwitterClientRw } from "./twitterClient.js";
import { twitterQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";

export async function fetchTweetStats() {
  logger.info("Starting daily Twitter engagement stats fetch...", { source: "twitter" });

  // Fetch recent posts that actually have a twitter_post_id
  const recentPosts = twitterQueries.getAll().filter(p => p.status === "posted" && p.twitter_post_id);

  if (recentPosts.length === 0) {
    logger.info("No posted tweets found to track.", { source: "twitter" });
    return;
  }

  // We batch request up to 100 IDs at a time per Twitter API limits
  const chunkArray = (arr: any[], size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );

  const chunks = chunkArray(recentPosts, 100);

  let updatedCount = 0;

  for (const chunk of chunks) {
    const ids = chunk.map(p => p.twitter_post_id!);
    
    try {
      const { data, errors } = await getTwitterClientRw().v2.tweets(ids, {
        "tweet.fields": "public_metrics"
      });

      if (errors) {
        logger.warn(`Twitter API returned some errors for tracking: ${JSON.stringify(errors)}`, { source: "twitter" });
      }

      for (const tweet of (data || [])) {
        if (!tweet.public_metrics) continue;

        // Find the database ID matching this tweet ID
        const dbPost = chunk.find(p => p.twitter_post_id === tweet.id);
        if (dbPost) {
          twitterQueries.update(dbPost.id, {
            impressions: tweet.public_metrics.impression_count || 0,
            likes: tweet.public_metrics.like_count || 0,
            replies: tweet.public_metrics.reply_count || 0,
          } as unknown as Partial<import("../../db/queries.js").TwitterPost>);
          updatedCount++;
        }
      }
    } catch (e: any) {
      logger.error(`Failed to fetch tweet stats: ${e.message}`, { source: "twitter", error: String(e) });
    }
  }

  logger.info(`Twitter stats fetch complete. Updated ${updatedCount} posts.`, { source: "twitter" });
}
