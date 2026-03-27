import Snoowrap from "snoowrap";
import { env } from "../../config/env.js";

export function isRedditConfigured(): boolean {
  return !!(
    env.REDDIT_CLIENT_ID &&
    env.REDDIT_CLIENT_SECRET &&
    env.REDDIT_USERNAME &&
    env.REDDIT_PASSWORD
  );
}

// Lazy getter — only instantiated when credentials are present
let _client: Snoowrap | null = null;

export function getRedditClient(): Snoowrap {
  if (!isRedditConfigured()) {
    throw new Error(
      "Reddit credentials not configured. Add REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD to your .env file."
    );
  }
  if (!_client) {
    _client = new Snoowrap({
      userAgent: env.REDDIT_USER_AGENT || "Outly/1.0",
      clientId: env.REDDIT_CLIENT_ID!,
      clientSecret: env.REDDIT_CLIENT_SECRET!,
      username: env.REDDIT_USERNAME!,
      password: env.REDDIT_PASSWORD!,
    });
  }
  return _client;
}
