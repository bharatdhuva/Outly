import { TwitterApi } from 'twitter-api-v2';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

async function run() {
  try {
    const me = await client.v2.me();
    console.log("Me:", me);
    const tweet = await client.v2.tweet("Automated test from JobOS! " + Date.now());
    console.log("Tweet success:", tweet);
  } catch (err: any) {
    if (err.data) {
      console.log("Error details:", err.data);
    } else {
      console.log("Generic Error:", err);
    }
  }
}

run();
