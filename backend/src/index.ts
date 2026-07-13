import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });

import fs from "fs";
import { env } from "./config/env.js";
import { startServer } from "./api/server.js";
import { scheduleDailySummary } from "./jobs/dailySummary.cron.js";
import { scheduleFollowUpChecker } from "./jobs/followUpChecker.cron.js";
import { scheduleWeeklyReport } from "./jobs/weeklyReport.cron.js";
import "./queue/processors.js";
import { logger } from "./lib/logger.js";
import { connectDB } from "./db/connection.js";

async function main() {
  [
    env.DATA_DIR,
    env.LOGS_DIR,
    path.join(env.DATA_DIR, "uploads"),
    path.join(env.DATA_DIR, "resumes")
  ].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`, { source: "system" });
    }
  });

  // Start HTTP Server instantly
  await startServer();
  logger.info("Outly server started instantly — listening for connections", { source: "system" });

  // Connect to MongoDB in the background
  logger.info(`Connecting to MongoDB in the background at ${env.MONGODB_URI}...`, { source: "system" });
  connectDB()
    .then((connected) => {
      if (connected) {
        logger.info("✅ Connected to MongoDB successfully in background", { source: "system" });
      } else {
        logger.error("❌ Failed to connect to MongoDB in background", { source: "system" });
      }
    })
    .catch((err) => {
      logger.error("❌ MongoDB background connection error:", { error: err instanceof Error ? err.stack || err.message : String(err), source: "system" });
    });

  scheduleDailySummary();
  scheduleFollowUpChecker();
  scheduleWeeklyReport();

  logger.info("Outly started — all services initialized", { source: "system" });
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
