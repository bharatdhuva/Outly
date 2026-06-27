import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

config({ path: ".env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");

export const env = {
  PORT: parseInt(process.env.PORT ?? "3001", 10),
  CLIENT_PORT: parseInt(process.env.CLIENT_PORT ?? "3000", 10),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? `http://localhost:${process.env.CLIENT_PORT ?? "3000"}`,
  NODE_ENV: process.env.NODE_ENV ?? "development",

  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  GROK_API_KEY: process.env.GROK_API_KEY ?? "",
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ?? "",


  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID ?? "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? process.env.GMAIL_CLIENT_ID ?? "",
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

  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "",
  TWILIO_WHATSAPP_FROM:
    process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886",
  YOUR_WHATSAPP_NUMBER: process.env.YOUR_WHATSAPP_NUMBER ?? "",

  NEWS_API_KEY: process.env.NEWS_API_KEY ?? "",
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ?? "1b67c05546msh5be6577efeb69cdp1f9858jsn6c581c858238",

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

  MORNING_BRIEFING_CRON: process.env.MORNING_BRIEFING_CRON ?? "0 8 * * *",

  FOLLOWUP_ENABLED: process.env.FOLLOWUP_ENABLED ?? "true",
  FOLLOWUP_DELAY_DAYS: process.env.FOLLOWUP_DELAY_DAYS ?? "5",
  FOLLOWUP_CHECK_CRON: process.env.FOLLOWUP_CHECK_CRON ?? "0 */6 * * *",

  // Vercel serverless has read-only filesystem; only /tmp is writable
  DATA_DIR: process.env.VERCEL ? "/tmp/data" : path.join(projectRoot, "data"),
  LOGS_DIR: process.env.VERCEL ? "/tmp/logs" : path.join(projectRoot, "logs"),
  LINKEDIN_COOKIES_PATH: process.env.VERCEL
    ? "/tmp/data/linkedin-cookies.json"
    : path.join(projectRoot, "data", "linkedin-cookies.json"),

  MONGODB_URI: process.env.MONGODB_URI ?? "mongodb://localhost:27017/outly",
  JWT_SECRET: process.env.JWT_SECRET ?? "super-secret-jwt-key-change-in-production",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ?? "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? "",

  BREVO_API_KEY: process.env.BREVO_API_KEY ?? "",
} as const;

