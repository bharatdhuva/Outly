import { env } from "../src/config/env.js";
import { fetchAllNews } from "../src/automation/news/fetcher.js";
import { generateLinkedInDraft, generateTwitterDraft } from "../src/automation/news/contentGenerator.js";
import { sendTelegramMessage } from "../src/notifications/telegram.js";

async function testDrafts() {
  console.log("Fetching news and generating drafts...");
  const news = await fetchAllNews();
  
  console.log("Generating LinkedIn draft...");
  const linkedinDraft = await generateLinkedInDraft(news);
  
  console.log("Generating Twitter draft...");
  const twitterDraft = await generateTwitterDraft(news);

  const formatMessage = (c: string, title: string) => `🔥 *Rise and Grind, Champion!* 💪\n\n──────────────────\n\n${title}\n\n${c}\n\n──────────────────\n\n🌟 *Aaj ka mantra:*\n_Every small step counts. Just keep moving._\n\n🌈 *Make today count!*\n— *Your Bot* ❤️`;

  console.log("LINKEDIN:");
  console.log(linkedinDraft);
  console.log("TWITTER:");
  console.log(twitterDraft);
  
  console.log("Finished.");
}

testDrafts().catch(console.error).finally(() => process.exit(0));
