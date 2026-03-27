import { config } from "dotenv";
config();
import { fetchAllNews } from "./src/automation/news/fetcher.js";
import { generateLinkedInPost } from "./src/automation/news/contentGenerator.js";
import { sendWhatsApp } from "./src/notifications/whatsapp.js";

async function run() {
  console.log("1. Fetching live tech news...");
  const news = await fetchAllNews();
  console.log(`✅ Fetched ${news.length} articles!`);
  
  console.log("\n2. Generating LinkedIn Post with Gemini 2.5 Flash...");
  const content = await generateLinkedInPost(news);
  
  console.log("\n================ GENERATED POST ================\n");
  console.log(content);
  console.log("\n================================================\n");
  
  console.log("3. (Safe Mode) Sending WhatsApp notification instead of posting to LinkedIn...");
  await sendWhatsApp(`🚀 *JobOS Test Run*\n\nGenerated a new LinkedIn post draft successfully! Check your terminal to read it.`);
  
  console.log("✅ Check your WhatsApp!");
}

run();
