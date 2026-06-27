import { getTwitterClientRw, isTwitterConfigured } from "../src/automation/twitter/twitterClient.js";

async function testPost() {
  if (!isTwitterConfigured()) {
    console.error("❌ Twitter credentials are missing in .env");
    console.error("Please add TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET.");
    process.exit(1);
  }

  try {
    console.log("Testing Twitter/X connection...");
    const twitterClientRw = getTwitterClientRw();
    const me = await twitterClientRw.v2.me();
    console.log(`✅ Authenticated as @${me.data.username} (${me.data.name})`);

    console.log("\nAttempting to post a test tweet...");
    const tweet = await twitterClientRw.v2.tweet("Hello World! This is an automated test from JobOS. 🚀");
    console.log(`✅ Tweet posted successfully! Tweet ID: ${tweet.data.id}`);
    console.log(`🔗 Link: https://twitter.com/${me.data.username}/status/${tweet.data.id}`);
  } catch (error: any) {
    console.error("\n❌ Failed to connect or post to Twitter:");
    if (error.code === 403) {
      console.error("Error 403: Forbidden. Make sure your App has 'Read and Write' permissions in the Twitter Developer Portal.");
    } else {
      console.error(error.message || error);
    }
  }
}

testPost();
