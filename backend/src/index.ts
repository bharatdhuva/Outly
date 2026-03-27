import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });

import fs from "fs";
import { env } from "./config/env.js";
import { startServer } from "./api/server.js";
import { scheduleWeeklyPost } from "./jobs/weeklyPost.cron.js";
import { scheduleDailySummary } from "./jobs/dailySummary.cron.js";
import { scheduleFollowUpChecker } from "./jobs/followUpChecker.cron.js";
import { scheduleSocialDrafts } from "./jobs/socialDrafts.cron.js";
import { scheduleWeeklyThread } from "./jobs/weeklyThread.cron.js";
import { scheduleTweetTracker } from "./jobs/tweetTracker.cron.js";
import { scheduleWeeklyRedditPost } from "./jobs/weeklyReddit.cron.js";
import { scheduleRedditTracker } from "./jobs/redditTracker.cron.js";
import { scheduleWeeklyReport } from "./jobs/weeklyReport.cron.js";
import { scheduleMorningBriefing } from "./jobs/morningBriefing.cron.js";
import { scheduleDailyLinkedInDraft } from "./jobs/dailyLinkedInDraft.cron.js";
import "./queue/processors.js";
import { registerTelegramCallbacks } from "./approval/callbackHandler.js";
import { logger } from "./lib/logger.js";

async function main() {
  [env.DATA_DIR, env.LOGS_DIR, path.join(env.DATA_DIR, "uploads")].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`, { source: "system" });
    }
  });

  scheduleWeeklyPost();
  scheduleDailySummary();
  scheduleFollowUpChecker();
  scheduleSocialDrafts();
  scheduleWeeklyThread();
  scheduleTweetTracker();
  scheduleWeeklyRedditPost();
  scheduleRedditTracker();
  scheduleWeeklyReport();
  scheduleDailyLinkedInDraft();
  scheduleMorningBriefing();
  registerTelegramCallbacks();
  await startServer();

  logger.info("JobOS started — all services initialized", { source: "system" });
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
