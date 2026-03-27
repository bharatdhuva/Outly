// @ts-ignore
import TelegramBot from 'node-telegram-bot-api';
import { telegramBot, editTelegramMessage, sendTelegramMessage } from '../notifications/telegram.js';
import { approvalQueries, postQueries, twitterQueries, redditQueries, activityQueries, companyQueries } from '../db/queries.js';
import { logger } from '../lib/logger.js';
import { tweetQueue } from '../queue/tweetQueue.js';
import { redditQueue } from '../queue/redditQueue.js';
import { sendWhatsApp } from '../notifications/whatsapp.js';
import { fetchAllNews } from '../automation/news/fetcher.js';
import { generateLinkedInDraft } from '../automation/news/contentGenerator.js';
import { requestApproval } from './approvalManager.js';
import { env } from '../config/env.js';

const activeEdits = new Map<number, number>();
let isPaused = false;

export function registerTelegramCallbacks() {
  if (!telegramBot) return;

  // ═══════════════════════════════════════════════
  // CALLBACK QUERY HANDLER (Inline Buttons)
  // ═══════════════════════════════════════════════
  telegramBot.on('callback_query', async (query: TelegramBot.CallbackQuery) => {
    if (!query.data || !query.message) return;

    const dataParts = query.data.split('_');
    const action = dataParts[0];
    const approvalId = parseInt(dataParts[1], 10);
    const messageId = query.message.message_id;

    // ─── Action Buttons (Morning Briefing) ───
    if (action.startsWith('action')) {
      if (query.data === 'action_start_mails') {
        const { mailQueue } = await import('../queue/mailQueue.js');
        const approved = companyQueries.getByStatus('approved');
        for (const c of approved) {
          await mailQueue.add({ companyId: c.id });
        }
        await sendTelegramMessage(`📧 Started mail queue — ${approved.length} mails queued!`);
      } else if (query.data === 'action_generate_linkedin') {
        await sendTelegramMessage('🔄 Generating fresh LinkedIn draft...');
        try {
          const news = await fetchAllNews();
          const content = await generateLinkedInDraft(news);
          const post = postQueries.insert({
            content,
            news_sources: JSON.stringify(news.map((n) => ({ title: n.title, url: n.url }))),
            status: 'draft',
            posted_at: null,
            linkedin_post_url: null,
          });
          const postId = Number((post as { lastInsertRowid: number }).lastInsertRowid);
          await requestApproval('linkedin', postId, content);
        } catch (e) {
          await sendTelegramMessage(`❌ Failed to generate LinkedIn draft: ${String(e)}`);
        }
      } else if (query.data === 'action_view_pending') {
        const pending = approvalQueries.getAllPending();
        if (pending.length === 0) {
          await sendTelegramMessage('✅ No pending approvals! All clear.');
        } else {
          const lines = pending.map((p, i) => {
            const icon = p.platform === 'linkedin' ? '🔵' : p.platform === 'twitter' ? '🐦' : '🟠';
            return `${i + 1}. ${icon} ${p.platform} — ${p.draft_content.substring(0, 60)}...`;
          });
          await sendTelegramMessage(`📋 Pending Approvals (${pending.length}):\n\n${lines.join('\n')}`);
        }
      } else if (query.data === 'action_today_summary') {
        const mailsToday = companyQueries.countMailsSentToday();
        const pendingApprovals = approvalQueries.getAllPending();
        const summary = `📅 Today's Summary\n━━━━━━━━━━━━━━━━━━━━━━\n📧 Mails sent today: ${mailsToday}/${env.MAX_EMAILS_PER_DAY}\n📋 Pending approvals: ${pendingApprovals.length}\n━━━━━━━━━━━━━━━━━━━━━━`;
        await sendTelegramMessage(summary);
      } else if (query.data === 'action_status') {
        const { mailQueue } = await import('../queue/mailQueue.js');
        const mailWaiting = await mailQueue.getWaitingCount();
        const mailActive = await mailQueue.getActiveCount();
        const status = `🤖 JobOS v2.3 System Status\n━━━━━━━━━━━━━━━━━━━━━━\n${isPaused ? '⏸️ System: PAUSED' : '▶️ System: RUNNING'}\n📧 Mail Queue: ${mailWaiting} waiting, ${mailActive} active\n🔵 LinkedIn: Manual draft mode (safe)\n━━━━━━━━━━━━━━━━━━━━━━`;
        await sendTelegramMessage(status);
      }
      telegramBot?.answerCallbackQuery(query.id);
      return;
    }

    const approval = approvalQueries.getById(approvalId);
    if (!approval) {
      telegramBot?.answerCallbackQuery(query.id, { text: 'Approval not found.' });
      return;
    }

    try {
      // ─── APPROVE ───
      if (action === 'approve') {
        const draft = approval.edit_improved_text || approval.draft_content;
        approvalQueries.update(approvalId, { status: 'approved', actioned_at: new Date().toISOString() });
        
        if (approval.platform === 'linkedin') {
          // v2.3: LinkedIn is NEVER auto-posted. Mark as approved, tell user to paste manually.
          postQueries.update(approval.post_id, { content: draft, status: 'approved' });
          
          await editTelegramMessage(messageId, 
            `✅ Approved! Ab LinkedIn pe jaake paste kar do aur post kar dena 🔥\n\n` +
            `📋 Post copy karne ke liye neeche Copy button daba:\n`, 
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📋 Copy Full Post', callback_data: `copy_${approvalId}` }],
                  [{ text: '✅ Mark as Posted', callback_data: `markposted_${approvalId}` }]
                ]
              }
            }
          );
          
          await sendWhatsApp('🔵 LinkedIn post approved! Go paste it manually 🚀');
          activityQueries.add('success', 'LinkedIn post approved for manual posting via Telegram');
          
        } else if (approval.platform === 'twitter') {
          twitterQueries.update(approval.post_id, { content: draft, status: 'approved' });
          await tweetQueue.add({ dbId: approval.post_id });
          await editTelegramMessage(messageId, `✅ Tweet approved & queued for auto-posting!\n\n${draft.substring(0, 100)}...`);
          activityQueries.add('success', 'Approved Twitter post via Telegram');
          
        } else if (approval.platform === 'reddit') {
          redditQueries.update(approval.post_id, { content: draft, status: 'approved' });
          await redditQueue.add({ dbId: approval.post_id });
          await editTelegramMessage(messageId, `✅ Reddit post approved & queued!\n\n${draft.substring(0, 100)}...`);
          activityQueries.add('success', 'Approved Reddit post via Telegram');
        }

      // ─── SKIP ───
      } else if (action === 'skip') {
        approvalQueries.update(approvalId, { status: 'skipped', actioned_at: new Date().toISOString() });
        await editTelegramMessage(messageId, `❌ Skipped ${approval.platform} post.`);
        activityQueries.add('info', `Skipped ${approval.platform} post via Telegram`);

      // ─── FULL PREVIEW ───
      } else if (action === 'preview') {
        const draft = approval.edit_improved_text || approval.draft_content;
        await sendTelegramMessage(`👁️ Full Preview — ${approval.platform.toUpperCase()} Post:\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${draft}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 ${draft.length} characters`);
      
      // ─── COPY FULL POST (v2.3 LinkedIn special) ───
      } else if (action === 'copy') {
        const draft = approval.edit_improved_text || approval.draft_content;
        // Send the full post as a clean message — user can long-press/select-all to copy on mobile
        await sendTelegramMessage(draft);
        await sendTelegramMessage('👆 Upar wala message long-press karke copy kar lo, phir LinkedIn pe paste kardo! 🚀');
        
      // ─── MARK AS POSTED (v2.3 LinkedIn manual) ───
      } else if (action === 'markposted') {
        postQueries.updateStatus(approval.post_id, 'posted', {
          posted_at: new Date().toISOString(),
        });
        approvalQueries.update(approvalId, { status: 'approved', actioned_at: new Date().toISOString() });
        await editTelegramMessage(messageId, `🎉 LinkedIn post marked as posted! Great job today! 💪`);
        activityQueries.add('success', 'LinkedIn post marked as manually posted');
        await sendWhatsApp('✅ LinkedIn post published manually! 🔥');
      
      // ─── EDIT ───
      } else if (action === 'edit') {
        activeEdits.set(query.message.chat.id, approvalId);
        await sendTelegramMessage(
          `✏️ Edit Mode — ${approval.platform.toUpperCase()} Post\n\n` +
          `Send me your instruction like:\n` +
          `• "make it shorter"\n` +
          `• "add more emojis"\n` +
          `• "change the hook"\n` +
          `• Or paste your own edited version\n\n` +
          `Type /cancel to abort edit.`
        );
      }

      await telegramBot?.answerCallbackQuery(query.id);
    } catch (e) {
      logger.error('Callback handler error', { error: String(e), source: 'telegram' });
      telegramBot?.answerCallbackQuery(query.id, { text: 'An error occurred' });
    }
  });

  // ═══════════════════════════════════════════════
  // MESSAGE HANDLER (Edit flow - AI improvement)
  // ═══════════════════════════════════════════════
  telegramBot.on('message', async (msg: TelegramBot.Message) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const approvalId = activeEdits.get(chatId);
    
    if (approvalId) {
      const approval = approvalQueries.getById(approvalId);
      if (approval) {
        await sendTelegramMessage('🤖 Improving with Gemini AI...');
        try {
          const { improveDraftWithAI } = await import('./aiEditor.js');
          const originalDraft = approval.edit_improved_text || approval.draft_content;
          const improvement = await improveDraftWithAI(originalDraft, approval.platform, msg.text);
          
          approvalQueries.update(approvalId, { 
            status: 'edit_requested',
            edit_requested_text: msg.text,
            edit_improved_text: improvement.improved_post 
          });

          const isLinkedIn = approval.platform === 'linkedin';
          const buttons = [
            [
              { text: '✅ Post This', callback_data: `approve_${approvalId}` }, 
              { text: '🔄 Try Again', callback_data: `edit_${approvalId}` }
            ],
            [{ text: '❌ Cancel', callback_data: `skip_${approvalId}` }]
          ];
          
          if (isLinkedIn) {
            buttons.push([{ text: '📋 Copy Full Post', callback_data: `copy_${approvalId}` }]);
          }

          const replyMarkup = { inline_keyboard: buttons };

          await sendTelegramMessage(
            `🤖 AI-Improved Version:\n━━━━━━━━━━━━━━━━━━━━━\n${improvement.improved_post}\n━━━━━━━━━━━━━━━━━━━━━\n📊 ${improvement.improved_post.length} chars | Change: ${improvement.change_summary}`, 
            { reply_markup: replyMarkup }
          );
          activeEdits.delete(chatId);
        } catch (e) {
          await sendTelegramMessage('⚠️ Failed to improve draft with AI. Try again.');
        }
      }
    }
  });

  // ═══════════════════════════════════════════════
  // TELEGRAM BOT COMMANDS (v2.3)
  // ═══════════════════════════════════════════════

  // /cancel — Cancel active edit
  telegramBot.onText(/\/cancel/, (msg: TelegramBot.Message) => {
    if (activeEdits.has(msg.chat.id)) {
      activeEdits.delete(msg.chat.id);
      telegramBot?.sendMessage(msg.chat.id, '🚫 Edit cancelled.');
    }
  });

  // /today — Today's summary or 📅 Today
  telegramBot.onText(/^\/today|📅 Today/, async (msg: TelegramBot.Message) => {
    try {
      const mailsToday = companyQueries.countMailsSentToday();
      const pendingApprovals = approvalQueries.getAllPending();
      
      const summary = `
📅 Today's Summary
━━━━━━━━━━━━━━━━━━━━━━
📧 Mails sent today: ${mailsToday}/${env.MAX_EMAILS_PER_DAY}
📋 Pending approvals: ${pendingApprovals.length}
━━━━━━━━━━━━━━━━━━━━━━
      `.trim();
      
      const replyMarkup = {
        keyboard: [
          [{ text: '🔵 Generate LinkedIn Post' }],
          [{ text: '🐦 Generate Twitter Post' }]
        ],
        resize_keyboard: true,
        is_persistent: true
      };

      await telegramBot?.sendMessage(msg.chat.id, summary, { reply_markup: replyMarkup });
    } catch (e) {
      await telegramBot?.sendMessage(msg.chat.id, '❌ Error fetching today\'s summary');
    }
  });

  // /pending — Show all pending approvals or 📋 View Pending
  telegramBot.onText(/^\/pending|📋 View Pending/, async (msg: TelegramBot.Message) => {
    try {
      const pending = approvalQueries.getAllPending();
      if (pending.length === 0) {
        await telegramBot?.sendMessage(msg.chat.id, '✅ No pending approvals! All clear.');
        return;
      }
      
      const lines = pending.map((p, i) => {
        const icon = p.platform === 'linkedin' ? '🔵' : p.platform === 'twitter' ? '🐦' : '🟠';
        return `${i + 1}. ${icon} ${p.platform} — ${p.draft_content.substring(0, 60)}...`;
      });
      
      await telegramBot?.sendMessage(msg.chat.id, `📋 Pending Approvals (${pending.length}):\n\n${lines.join('\n')}`);
    } catch (e) {
      await telegramBot?.sendMessage(msg.chat.id, '❌ Error fetching pending approvals');
    }
  });

  // /status — System status or 📊 Status
  telegramBot.onText(/^\/status|📊 Status/, async (msg: TelegramBot.Message) => {
    try {
      const { mailQueue } = await import('../queue/mailQueue.js');
      const mailWaiting = await mailQueue.getWaitingCount();
      const mailActive = await mailQueue.getActiveCount();
      
      const status = `
🤖 JobOS v2.3 System Status
━━━━━━━━━━━━━━━━━━━━━━
${isPaused ? '⏸️ System: PAUSED' : '▶️ System: RUNNING'}
📧 Mail Queue: ${mailWaiting} waiting, ${mailActive} active
🔵 LinkedIn: Manual draft mode (safe)
🐦 Twitter: Auto-post with approval
🟠 Reddit: Auto-post with approval
━━━━━━━━━━━━━━━━━━━━━━
      `.trim();
      
      await telegramBot?.sendMessage(msg.chat.id, status);
    } catch (e) {
      await telegramBot?.sendMessage(msg.chat.id, '❌ Error fetching status');
    }
  });

  // /generate_linkedin or 📑 Generate LinkedIn Post
  telegramBot.onText(/^\/generate[_-]?linkedin|📑 Generate LinkedIn Post/i, async (msg: TelegramBot.Message) => {
    try {
      await telegramBot?.sendMessage(msg.chat.id, '🔄 Generating LinkedIn post...');
      const news = await fetchAllNews();
      const content = await generateLinkedInDraft(news);
      
      const post = postQueries.insert({ 
        content: content, 
        news_sources: JSON.stringify(news.map(n => ({ title: n.title, url: n.url }))), 
        status: 'draft', 
        posted_at: null, 
        linkedin_post_url: null 
      });
      const { requestApproval } = await import('./approvalManager.js');
      await requestApproval('linkedin', Number((post as any).lastInsertRowid), content);
    } catch (e) {
      await telegramBot?.sendMessage(msg.chat.id, `❌ Failed: ${String(e)}`);
    }
  });

  // /generate_twitter or 💡 Generate Twitter Post
  telegramBot.onText(/^\/generate[_-]?twitter|💡 Generate Twitter Post|🐦 Generate Twitter Post/i, async (msg: TelegramBot.Message) => {
    try {
      await telegramBot?.sendMessage(msg.chat.id, '🔄 Generating Twitter post...');
      const news = await fetchAllNews();
      const { generateTwitterDraft } = await import('../automation/news/contentGenerator.js');
      const content = await generateTwitterDraft(news);
      
      const tweet = twitterQueries.insert({ 
        content: content, 
        type: 'single',
        status: 'draft', 
        posted_at: null,
        twitter_post_id: null,
        impressions: 0,
        likes: 0,
        replies: 0,
        error_message: null
      });
      const { requestApproval } = await import('./approvalManager.js');
      await requestApproval('twitter', Number((tweet as any).lastInsertRowid), content);
    } catch (e) {
      await telegramBot?.sendMessage(msg.chat.id, `❌ Failed: ${String(e)}`);
    }
  });

  // /pause — Pause all queues
  telegramBot.onText(/^\/pause/, async (msg: TelegramBot.Message) => {
    isPaused = !isPaused;
    const statusMsg = isPaused 
      ? '⏸️ JobOS PAUSED — No new items will be processed. Use /pause again to resume.'
      : '▶️ JobOS RESUMED — Back in action! 🚀';
    await telegramBot?.sendMessage(msg.chat.id, statusMsg);
    activityQueries.add('info', isPaused ? 'System paused via Telegram' : 'System resumed via Telegram');
  });

  // /report — Weekly report summary
  telegramBot.onText(/\/report/, async (msg: TelegramBot.Message) => {
    try {
      const mailsThisWeek = companyQueries.countMailsSentThisWeek();
      const repliesThisWeek = companyQueries.countRepliesThisWeek();
      const tweetCount = twitterQueries.countPosted();
      const redditCount = redditQueries.countPosted();
      
      const report = `
📊 Weekly Report
━━━━━━━━━━━━━━━━━━━━━━

📧 Cold Mails: ${mailsThisWeek} sent
📬 Replies: ${repliesThisWeek} (${mailsThisWeek > 0 ? Math.round((repliesThisWeek / mailsThisWeek) * 100) : 0}% rate)
🐦 Tweets Posted: ${tweetCount}
🟠 Reddit Posts: ${redditCount}

━━━━━━━━━━━━━━━━━━━━━━
💡 Keep grinding! Consistency is key. 🚀
      `.trim();
      
      await telegramBot?.sendMessage(msg.chat.id, report);
    } catch (e) {
      await telegramBot?.sendMessage(msg.chat.id, '❌ Error generating report');
    }
  });

  // /help — Show all commands
  telegramBot.onText(/\/help|\/start/, async (msg: TelegramBot.Message) => {
    const helpText = `
🤖 JobOS v2.3 — Command Center
━━━━━━━━━━━━━━━━━━━━━━

/today — Today's summary
/pending — Pending approvals
/status — System status  
/generate_linkedin — Generate fresh LinkedIn draft
/pause — Pause/Resume system
/report — Weekly report
/help — Show this help

💡 Tip: Use the quick action buttons below!
    `.trim();
    
    const replyMarkup = {
      keyboard: [
        [{ text: '📑 Generate LinkedIn Post' }],
        [{ text: '💡 Generate Twitter Post' }]
      ],
      resize_keyboard: true,
      is_persistent: true
    };

    await telegramBot?.sendMessage(msg.chat.id, helpText, { reply_markup: replyMarkup });
  });



  // Start Cold Mails button handler
  telegramBot.onText(/📧 Start Cold Mails/, async (msg: TelegramBot.Message) => {
    try {
      const { mailQueue } = await import('../queue/mailQueue.js');
      const approved = companyQueries.getByStatus('approved');
      for (const c of approved) {
        await mailQueue.add({ companyId: c.id });
      }
      await telegramBot?.sendMessage(msg.chat.id, `📧 Started mail queue — ${approved.length} mails queued!`);
    } catch (e) {
      await telegramBot?.sendMessage(msg.chat.id, `❌ Failed to start mails`);
    }
  });
}
