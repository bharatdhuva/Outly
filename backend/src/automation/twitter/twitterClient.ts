import { TwitterApi } from "twitter-api-v2";
import { env } from "../../config/env.js";

export function isTwitterConfigured(): boolean {
  return !!(
    env.TWITTER_API_KEY &&
    env.TWITTER_API_SECRET &&
    env.TWITTER_ACCESS_TOKEN &&
    env.TWITTER_ACCESS_TOKEN_SECRET
  );
}

// Lazy getter — only instantiated when credentials are present
let _client: TwitterApi | null = null;

export function getTwitterClient(): TwitterApi {
  if (!isTwitterConfigured()) {
    throw new Error(
      "Twitter credentials not configured. Add TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET to your .env file."
    );
  }
  if (!_client) {
    _client = new TwitterApi({
      appKey: env.TWITTER_API_KEY!,
      appSecret: env.TWITTER_API_SECRET!,
      accessToken: env.TWITTER_ACCESS_TOKEN!,
      accessSecret: env.TWITTER_ACCESS_TOKEN_SECRET!,
    });
  }
  return _client;
}

export function getTwitterClientRw() {
  return getTwitterClient().readWrite;
}
