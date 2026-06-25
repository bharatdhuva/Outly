import cron from "node-cron";
import { fetchAllNews } from "../automation/news/fetcher.js";
import { generateLinkedInDraft, generateTwitterDraft } from "../automation/news/contentGenerator.js";
import { logger } from "../lib/logger.js";
import { postQueries, twitterQueries } from "../db/queries.js";

/**
 * Runs twice a day to generate separate social media drafts.
 * Saves raw drafts to DB directly for in-app review.
 */
export function scheduleSocialDrafts(): void {
  // 10:40 AM and 10:40 PM (22:40) every day test
  cron.schedule("40 10,22 * * *", async () => {
    try {
      logger.info("Generating daily social media drafts...", { source: "cron" });
      const news = await fetchAllNews();
      
      const linkedinDraft = await generateLinkedInDraft(news);
      const twitterContent = await generateTwitterDraft(news);

      // Save LinkedIn
      const post = postQueries.insert({ 
        content: linkedinDraft, 
        news_sources: JSON.stringify(news.map(n => ({ title: n.title, url: n.url }))), 
        status: 'draft', 
        posted_at: null, 
        linkedin_post_url: null 
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save Twitter
      const tweet = twitterQueries.insert({ 
        content: twitterContent, 
        type: 'single',
        status: 'draft', 
        posted_at: null,
        twitter_post_id: null,
        impressions: 0,
        likes: 0,
        replies: 0,
        error_message: null
      });
      
      logger.info("Social media drafts generated and saved to DB", { source: "cron" });
    } catch (e) {
      logger.error("Social media drafts cron failed", { error: String(e), source: "cron" });
    }
  });
  logger.info("Social Drafts scheduled: 40 10,22 * * *", { source: "system" });
}
