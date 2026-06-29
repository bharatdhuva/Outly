import cron from "node-cron";
import { env } from "../config/env.js";
import { companyQueries } from "../db/queries.js";
import { User as UserModel } from "../db/models.js";
import { sendWhatsApp } from "../notifications/whatsapp.js";
import { logger } from "../lib/logger.js";

export function scheduleDailySummary(): void {
  cron.schedule(env.DAILY_SUMMARY_CRON, async () => {
    try {
      const users = await UserModel.find();
      if (users.length === 0) return;

      logger.info(`Running daily summary cron for ${users.length} users...`, { source: "cron" });

      for (const user of users) {
        const userId = user._id.toString();
        
        try {
          const mailsSent = await companyQueries.countMailSent(userId);
          const mailsToday = await companyQueries.countMailsSentToday(userId);
          const replies = await companyQueries.countReplies(userId);

          const msg = `📧 Outly Daily Report
Mails sent today: ${mailsToday}
Total mails sent: ${mailsSent}
Replies received: ${replies}`;

          await sendWhatsApp(msg, userId);
        } catch (err) {
          logger.error("Failed to generate daily summary for user", { error: String(err), userId, source: "cron" });
        }
      }
    } catch (error) {
      logger.error("Daily summary cron failed:", error);
    }
  });
}
