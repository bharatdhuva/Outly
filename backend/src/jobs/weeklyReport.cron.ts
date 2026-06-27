import cron from "node-cron";
import { companyQueries } from "../db/queries.js";
import { User as UserModel } from "../db/models.js";
import { sendWhatsApp } from "../notifications/whatsapp.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

export function scheduleWeeklyReport() {
  if (!env.TWILIO_ACCOUNT_SID) return;

  // Run MONDAYS at 9:00 AM
  cron.schedule("0 9 * * 1", async () => {
    try {
      const users = await UserModel.find();
      if (users.length === 0) return;

      logger.info(`Running Weekly Report generation for ${users.length} users...`, { source: "outly" });

      for (const user of users) {
        const userId = user._id.toString();
        
        try {
          const mailsSentCount = await companyQueries.countMailsSentThisWeek(userId);
          const repliesCount = await companyQueries.countRepliesThisWeek(userId);

          const reportMessage = `📊 *Outly Weekly Digest*\n\nGreat work this week! Here's your automated summary:\n\n📧 *Cold Emails Sent:* ${mailsSentCount}\n🗣️ *Replies/Interviews:* ${repliesCount}\n\nKeep up the momentum! 🚀`;

          await sendWhatsApp(reportMessage, userId);
          logger.info("Weekly Report generated and sent via WhatsApp.", { source: "outly", userId });
        } catch (err) {
          logger.error("Failed to generate weekly report for user", { error: String(err), userId, source: "outly" });
        }
      }
    } catch (e: any) {
      logger.error("Failed to run weekly report cron", { error: String(e), source: "outly" });
    }
  });

  logger.info("Weekly Report Cron scheduled: 0 9 * * 1", { source: "system" });
}
