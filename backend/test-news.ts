import { fetchAllNews } from "./src/automation/news/fetcher.js";

async function run() {
  console.log("Fetching live news...");
  try {
    const news = await fetchAllNews();
    console.log(`Successfully fetched ${news.length} articles!`);
    console.log("Top 3 items:");
    console.log(JSON.stringify(news.slice(0, 3), null, 2));
  } catch (e) {
    console.error("Failed to fetch news:", e);
  }
}

run();
