import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

config({ path: ".env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");

export const env = {
  PORT: parseInt(process.env.PORT ?? "3001", 10),
  CLIENT_PORT: parseInt(process.env.CLIENT_PORT ?? "3000", 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",

  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  GROK_API_KEY: process.env.GROK_API_KEY ?? "",

  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID ?? "",
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET ?? "",
  GMAIL_REDIRECT_URI:
    process.env.GMAIL_REDIRECT_URI ??
    "http://localhost:3001/auth/gmail/callback",
  GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN ?? "",
  GMAIL_USER: process.env.GMAIL_USER ?? "",

  GOOGLE_DRIVE_REFRESH_TOKEN: process.env.GOOGLE_DRIVE_REFRESH_TOKEN ?? "",
  RESUME_DRIVE_FILE_ID: process.env.RESUME_DRIVE_FILE_ID ?? "",

  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID ?? "",
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ?? "",
  LINKEDIN_ACCESS_TOKEN: process.env.LINKEDIN_ACCESS_TOKEN ?? "",
  LINKEDIN_PERSON_URN: process.env.LINKEDIN_PERSON_URN ?? "",

  TWITTER_API_KEY: process.env.TWITTER_API_KEY ?? "",
  TWITTER_API_SECRET: process.env.TWITTER_API_SECRET ?? "",
  TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN ?? "",
  TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET ?? "",

  REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID ?? "",
  REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET ?? "",
  REDDIT_USERNAME: process.env.REDDIT_USERNAME ?? "",
  REDDIT_PASSWORD: process.env.REDDIT_PASSWORD ?? "",
  REDDIT_USER_AGENT: process.env.REDDIT_USER_AGENT ?? "Outly/1.0",

  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "",
  TWILIO_WHATSAPP_FROM:
    process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886",
  YOUR_WHATSAPP_NUMBER: process.env.YOUR_WHATSAPP_NUMBER ?? "",

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? "",
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ?? "",
  TELEGRAM_APPROVAL_TIMEOUT_HOURS: parseInt(process.env.TELEGRAM_APPROVAL_TIMEOUT_HOURS ?? "2", 10),
  TELEGRAM_BATCH_APPROVALS: process.env.TELEGRAM_BATCH_APPROVALS === "true",

  NEWS_API_KEY: process.env.NEWS_API_KEY ?? "",

  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",

  DB_PATH: process.env.DB_PATH ?? path.join(projectRoot, "data", "outly.db"),

  MAX_EMAILS_PER_DAY: parseInt(process.env.MAX_EMAILS_PER_DAY ?? "20", 10),
  MAX_APPLIES_PER_SESSION: parseInt(
    process.env.MAX_APPLIES_PER_SESSION ?? "15",
    10,
  ),
  MAIL_DELAY_MIN_SECONDS: parseInt(
    process.env.MAIL_DELAY_MIN_SECONDS ?? "180",
    10,
  ),
  MAIL_DELAY_MAX_SECONDS: parseInt(
    process.env.MAIL_DELAY_MAX_SECONDS ?? "420",
    10,
  ),
  APPLY_DELAY_MIN_SECONDS: parseInt(
    process.env.APPLY_DELAY_MIN_SECONDS ?? "45",
    10,
  ),
  APPLY_DELAY_MAX_SECONDS: parseInt(
    process.env.APPLY_DELAY_MAX_SECONDS ?? "90",
    10,
  ),

  WEEKLY_POST_CRON: process.env.WEEKLY_POST_CRON ?? "0 9 * * 1",
  DAILY_SUMMARY_CRON: process.env.DAILY_SUMMARY_CRON ?? "0 20 * * *",
  DAILY_TWEET_CRON: process.env.DAILY_TWEET_CRON ?? "0 8 * * 1-5",
  WEEKLY_THREAD_CRON: process.env.WEEKLY_THREAD_CRON ?? "0 19 * * 3",
  WEEKLY_REDDIT_CRON: process.env.WEEKLY_REDDIT_CRON ?? "0 10 * * 5",

  MORNING_BRIEFING_CRON: process.env.MORNING_BRIEFING_CRON ?? "0 8 * * *",

  FOLLOWUP_ENABLED: process.env.FOLLOWUP_ENABLED ?? "true",
  FOLLOWUP_DELAY_DAYS: process.env.FOLLOWUP_DELAY_DAYS ?? "5",
  FOLLOWUP_CHECK_CRON: process.env.FOLLOWUP_CHECK_CRON ?? "0 */6 * * *",

  DATA_DIR: path.join(projectRoot, "data"),
  LOGS_DIR: path.join(projectRoot, "logs"),
  LINKEDIN_COOKIES_PATH: path.join(
    projectRoot,
    "data",
    "linkedin-cookies.json",
  ),
} as const;
