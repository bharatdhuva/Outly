import { getTwitterClientRw } from "./twitterClient.js";
import { TwitterPost as TwitterPostModel } from "../../db/models.js";
import { logger } from "../../lib/logger.js";

export async function fetchTweetStats() {
  logger.info("Starting daily Twitter engagement stats fetch...", { source: "twitter" });

  try {
    // Fetch recent posts that actually have a twitter_post_id across all users
    const recentPosts = await TwitterPostModel.find({ 
      status: "posted", 
      twitter_post_id: { $ne: null } 
    });

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
            await TwitterPostModel.findByIdAndUpdate(dbPost._id, {
              $set: {
                impressions: tweet.public_metrics.impression_count || 0,
                likes: tweet.public_metrics.like_count || 0,
                replies: tweet.public_metrics.reply_count || 0,
              }
            });
            updatedCount++;
          }
        }
      } catch (e: any) {
        logger.error(`Failed to fetch tweet stats chunk: ${e.message}`, { source: "twitter", error: String(e) });
      }
    }

    logger.info(`Twitter stats fetch complete. Updated ${updatedCount} posts.`, { source: "twitter" });
  } catch (e: any) {
    logger.error(`Twitter stats fetch failed: ${e.message}`, { source: "twitter", error: String(e) });
  }
}
