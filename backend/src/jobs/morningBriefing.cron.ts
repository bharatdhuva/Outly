import cron from "node-cron";
import { env } from "../config/env.js";
import { companyQueries, approvalQueries, postQueries, twitterQueries, redditQueries } from "../db/queries.js";
import { sendTelegramMessage } from "../notifications/telegram.js";
import { logger } from "../lib/logger.js";

/**
 * v2.3 Morning Briefing — Enhanced with LinkedIn draft status, 
 * social media stats, and quick action buttons.
 * Runs at 8:00 AM IST daily.
 */
export function scheduleMorningBriefing(): void {
  cron.schedule(env.MORNING_BRIEFING_CRON, async () => {
    try {
      // ─── Pending Approvals ───
      const pendingApprovals = approvalQueries.getAllPending();
      let approvalsText = '';
      if (pendingApprovals.length === 0) {
        approvalsText = '  ✅ No pending approvals';
      } else {
        approvalsText = pendingApprovals.map(a => {
          const icon = a.platform === 'linkedin' ? '🔵' : a.platform === 'twitter' ? '🐦' : '🟠';
          return `  ${icon} ${a.platform} post waiting`;
        }).join('\n');
      }

      // ─── LinkedIn Draft Status ───
      const hasLinkedInDraft = pendingApprovals.some(a => a.platform === 'linkedin');
      const linkedInStatus = hasLinkedInDraft 
        ? '  ✅ Draft ready → Review below!' 
        : '  📝 No draft yet → Use button below to generate';

      // ─── Cold Mail Stats ───
      const followUpsDue = companyQueries.getDueForFollowUp(parseInt(env.FOLLOWUP_DELAY_DAYS, 10)).length;
      const pendingMails = companyQueries.getByStatus('approved').length;
      const mailsSentThisWeek = companyQueries.countMailsSentThisWeek();

      // ─── Social Media Stats ───
      const repliesThisWeek = companyQueries.countRepliesThisWeek();
      const twitterPosts = twitterQueries.countPosted();
      const redditPosts = redditQueries.countPosted();
      const linkedinPosts = postQueries.countPosted();

      // ─── AI Tip ───
      const tips = [
        "LinkedIn posts between 1000-1200 chars get 2x more engagement 📈",
        "Reply rate highest for Fintech companies — target more this week 🎯",
        "Tuesday and Thursday mornings are peak LinkedIn hours 📊",
        "Follow-up emails within 5 days double your response rate 📬",
        "Keep tweets under 200 characters for max engagement 🐦",
        "Consistency beats virality — show up every day! 💪",
        "Personalized cold mails get 3x more replies than templates 🎯",
      ];
      const tipOfDay = tips[Math.floor(Math.random() * tips.length)];

      const briefing = `
🌅 Good Morning, Bharat!
━━━━━━━━━━━━━━━━━━━━━━━━━━

🔵 LINKEDIN DRAFT:
${linkedInStatus}

📋 PENDING APPROVALS:
${approvalsText}

📧 COLD MAIL:
  Queue: ${pendingMails} ready to send
  Follow-ups due: ${followUpsDue}
  Sent this week: ${mailsSentThisWeek}

📊 THIS WEEK:
  📬 Replies: ${repliesThisWeek}
  🔵 LinkedIn: ${linkedinPosts} posts (manual)
  🐦 Twitter: ${twitterPosts} tweets
  🟠 Reddit: ${redditPosts} posts

💡 TIP: ${tipOfDay}
━━━━━━━━━━━━━━━━━━━━━━━━━━
      `.trim();

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '▶️ Generate Fresh LinkedIn Draft', callback_data: 'action_generate_linkedin' },
          ],
          [
            { text: '📧 Start Cold Mail Queue', callback_data: 'action_start_mails' }
          ]
        ]
      };

      await sendTelegramMessage(briefing, { reply_markup: replyMarkup });
      logger.info('Morning briefing sent via Telegram.', { source: 'cron' });
    } catch (e) {
      logger.error('Failed to send morning briefing:', { error: String(e), source: 'cron' });
    }
  });
  logger.info(`Morning Briefing scheduled: ${env.MORNING_BRIEFING_CRON}`, { source: "system" });
}
