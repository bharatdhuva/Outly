import { getRedditClient, isRedditConfigured } from "../src/automation/reddit/redditClient.js";

async function testReddit() {
  if (!isRedditConfigured()) {
    console.error("❌ Reddit credentials are missing in .env");
    console.error("Please add REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD.");
    process.exit(1);
  }

  try {
    console.log("Testing Reddit connection...");
    // @ts-ignore
    const me = await getRedditClient().getMe();
    console.log(`✅ Authenticated as u/${me.name}`);
    console.log(`Link Karma: ${me.link_karma} | Comment Karma: ${me.comment_karma}`);

    // We don't post a test post by default to avoid accidental spam/bans on Reddit, 
    // simply verifying the connection is enough for Reddit OAuth.
    console.log("\nReddit connection is successfully established and ready for automation! 🚀");

  } catch (error: any) {
    console.error("\n❌ Failed to connect to Reddit:");
    console.error(error.message || error);
  }
}

testReddit();
