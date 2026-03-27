import cron from "node-cron";
import { companyQueries } from "../db/queries.js";
import { sendWhatsApp } from "../notifications/whatsapp.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

export function scheduleWeeklyReport() {
  if (!env.TWILIO_ACCOUNT_SID) return;

  // Run MONDAYS at 9:00 AM
  cron.schedule("0 9 * * 1", async () => {
    logger.info("Running Weekly Report generation...", { source: "jobos" });

    try {
      const mailsSentCount = companyQueries.countMailsSentThisWeek();
      const repliesCount = companyQueries.countRepliesThisWeek();

      const reportMessage = `📊 *JobOS Weekly Digest*\n\nGreat work this week! Here's your automated summary:\n\n📧 *Cold Emails Sent:* ${mailsSentCount}\n🗣️ *Replies/Interviews:* ${repliesCount}\n\nKeep up the momentum! 🚀`;

      await sendWhatsApp(reportMessage);
      logger.info("Weekly Report generated and sent via WhatsApp.", { source: "jobos" });
    } catch (e: any) {
      logger.error("Failed to run weekly report cron", { error: String(e), source: "jobos" });
    }
  });

  logger.info("Weekly Report Cron scheduled: 0 9 * * 1", { source: "system" });
}
