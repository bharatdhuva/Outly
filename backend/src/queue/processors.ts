import { Job } from "bull";
import { mailQueue } from "./mailQueue.js";
import { followUpQueue } from "./followUpQueue.js";
import { tweetQueue } from "./tweetQueue.js";
import { redditQueue } from "./redditQueue.js";
import { sendColdMail, sendFollowUpMail } from "../automation/coldmail/mailSender.js";
import { publishTwitterPost } from "../automation/twitter/tweetPublisher.js";
import { publishRedditPost } from "../automation/reddit/redditPublisher.js";
import { env } from "../config/env.js";
import { companyQueries } from "../db/queries.js";
import { sendWhatsApp } from "../notifications/whatsapp.js";
import { logger } from "../lib/logger.js";

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Mail processor
mailQueue.process(async (job: Job<{ companyId: number }>) => {
  const { companyId } = job.data;
  const company = companyQueries.getById(companyId);
  if (!company || company.status !== "approved") return;

  const sentToday = companyQueries.countMailsSentToday();
  if (sentToday >= env.MAX_EMAILS_PER_DAY) {
    logger.warn("Daily email limit reached", { source: "mail" });
    throw new Error("Daily limit reached");
  }

  const success = await sendColdMail(companyId);
  if (success) {
    await sendWhatsApp(`✅ Cold mail sent to ${company.company_name} (${company.role})`);
  } else {
    await sendWhatsApp(`⚠️ Mail failed: ${company.company_name} — check logs`, true);
  }

  // Human-like delay before next
  const delaySec = randomBetween(env.MAIL_DELAY_MIN_SECONDS, env.MAIL_DELAY_MAX_SECONDS);
  logger.info(`Waiting ${delaySec}s before next mail`, { source: "mail" });
  await new Promise((r) => setTimeout(r, delaySec * 1000));
});

// Follow-up processor
followUpQueue.process(async (job: Job<{ companyId: number, subject: string, body: string }>) => {
  const { companyId, subject, body } = job.data;
  const company = companyQueries.getById(companyId);
  
  // Verify it still hasn't replied and hasn't had follow-up sent already
  if (!company || company.reply_detected_at) return;
  if (company.followup_status === "sent") return; // double check

  const success = await sendFollowUpMail(companyId, subject, body);
  if (success) {
    await sendWhatsApp(`📨 Follow-up sent to ${company.company_name} — Day 5`);
  } else {
    await sendWhatsApp(`⚠️ Follow-up failed: ${company.company_name} — check logs`, true);
  }

  // Same human-like delay as original mail sending
  const delaySec = randomBetween(env.MAIL_DELAY_MIN_SECONDS, env.MAIL_DELAY_MAX_SECONDS);
  logger.info(`Waiting ${delaySec}s before next follow-up`, { source: "mail" });
  await new Promise((r) => setTimeout(r, delaySec * 1000));
});

// Tweet publisher processor
tweetQueue.process(async (job: Job<{ dbId: number }>) => {
  const { dbId } = job.data;
  
  const success = await publishTwitterPost(dbId);
  if (success) {
    await sendWhatsApp(`🐦 Successfully sent dynamic Twitter post!`);
  } else {
    await sendWhatsApp(`⚠️ Twitter post failed! Connect to dashboard to view logs.`, true);
  }
});

// Reddit publisher processor
redditQueue.process(async (job: Job<{ dbId: number }>) => {
  const { dbId } = job.data;
  
  const success = await publishRedditPost(dbId);
  if (success) {
    await sendWhatsApp(`🚀 Successfully posted dynamic content to Reddit!`);
  } else {
    await sendWhatsApp(`⚠️ Reddit post failed! Check dashboard logs.`, true);
  }
});
