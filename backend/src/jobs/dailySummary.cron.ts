import cron from "node-cron";
import { env } from "../config/env.js";
import { companyQueries, postQueries } from "../db/queries.js";
import { sendWhatsApp } from "../notifications/whatsapp.js";

export function scheduleDailySummary(): void {
  cron.schedule(env.DAILY_SUMMARY_CRON, async () => {
    const mailsSent = companyQueries.countMailSent();
    const mailsToday = companyQueries.countMailsSentToday();
    const replies = companyQueries.countReplies();
    const latestPost = postQueries.getAll()[0];
    const postStatus = latestPost?.status === "posted" ? "✅ Published" : "❌ Not published";

    const msg = `📧 JobOS Daily Report
Mails sent today: ${mailsToday}
Total mails sent: ${mailsSent}
Replies received: ${replies}
LinkedIn post: ${postStatus}`;

    await sendWhatsApp(msg);
  });
}
