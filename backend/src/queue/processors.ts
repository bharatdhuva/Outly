import { Job } from "bull";
import { mailQueue } from "./mailQueue.js";
import { followUpQueue } from "./followUpQueue.js";
import { sendColdMail, sendFollowUpMail } from "../automation/coldmail/mailSender.js";
import { env } from "../config/env.js";
import { companyQueries } from "../db/queries.js";
import { sendWhatsApp } from "../notifications/whatsapp.js";
import { logger } from "../lib/logger.js";

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Mail processor
mailQueue.process(async (job: Job<{ companyId: string }>) => {
  const { companyId } = job.data;
  const company = await companyQueries.getById(companyId);
  if (!company || company.status !== "approved") return;

  const sentToday = await companyQueries.countMailsSentToday(company.userId);
  if (sentToday >= env.MAX_EMAILS_PER_DAY) {
    logger.warn("Daily email limit reached", { source: "mail", userId: company.userId });
    throw new Error("Daily limit reached");
  }

  const success = await sendColdMail(companyId);
  if (success) {
    await sendWhatsApp(`✅ Cold mail sent to ${company.company_name} (${company.role})`, company.userId);
  } else {
    await sendWhatsApp(`⚠️ Mail failed: ${company.company_name} — check logs`, company.userId, true);
  }

  // Human-like delay before next
  const delaySec = randomBetween(env.MAIL_DELAY_MIN_SECONDS, env.MAIL_DELAY_MAX_SECONDS);
  logger.info(`Waiting ${delaySec}s before next mail`, { source: "mail", userId: company.userId });
  await new Promise((r) => setTimeout(r, delaySec * 1000));
});

// Follow-up processor
followUpQueue.process(async (job: Job<{ companyId: string, subject: string, body: string }>) => {
  const { companyId, subject, body } = job.data;
  const company = await companyQueries.getById(companyId);
  
  // Verify it still hasn't replied and hasn't had follow-up sent already
  if (!company || company.reply_detected_at) return;
  if (company.followup_status === "sent") return; // double check

  const success = await sendFollowUpMail(companyId, subject, body);
  if (success) {
    await sendWhatsApp(`📨 Follow-up sent to ${company.company_name} — Day 5`, company.userId);
  } else {
    await sendWhatsApp(`⚠️ Follow-up failed: ${company.company_name} — check logs`, company.userId, true);
  }

  // Same human-like delay as original mail sending
  const delaySec = randomBetween(env.MAIL_DELAY_MIN_SECONDS, env.MAIL_DELAY_MAX_SECONDS);
  logger.info(`Waiting ${delaySec}s before next follow-up`, { source: "mail", userId: company.userId });
  await new Promise((r) => setTimeout(r, delaySec * 1000));
});
