import nodemailer from "nodemailer";
import { google } from "googleapis";
import { env } from "../../config/env.js";
import { companyQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";
import { activityQueries } from "../../db/queries.js";
import { getSenderEmail, getSenderName } from "../../config/appSettings.js";

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const oauth2Client = new google.auth.OAuth2(
    env.GMAIL_CLIENT_ID,
    env.GMAIL_CLIENT_SECRET,
    env.GMAIL_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });
  const accessToken = await oauth2Client.getAccessToken();
  if (!accessToken.token) throw new Error("Gmail OAuth: No access token");

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: getSenderEmail(),
      accessToken: accessToken.token,
      clientId: env.GMAIL_CLIENT_ID,
      clientSecret: env.GMAIL_CLIENT_SECRET,
      refreshToken: env.GMAIL_REFRESH_TOKEN,
    },
  });
  return transporter;
}

export async function sendColdMail(companyId: number): Promise<boolean> {
  const company = companyQueries.getById(companyId);
  if (!company || company.status !== "approved") return false;
  if (!company.generated_subject || !company.generated_mail) return false;

  try {
    const transport = await getTransporter();
    const messageId = `<${Date.now()}.${companyId}@jobos.local>`;
    const senderName = company.sender_name || getSenderName();
    const senderEmail = getSenderEmail();
    await transport.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: company.hr_email,
      subject: company.generated_subject,
      text: company.generated_mail,
      html: company.generated_mail.replace(/\n/g, "<br>"),
      headers: {
        "Message-ID": messageId,
        "Reply-To": senderEmail,
        "List-Unsubscribe": `<mailto:${senderEmail}?subject=unsubscribe>`,
      },
    });

    const now = new Date().toISOString();
    companyQueries.updateStatus(companyId, "mail_sent", {
      sent_at: now,
      error_message: null,
    } as unknown as Partial<import("../../db/queries.js").Company>);

    activityQueries.add(
      "mail_sent",
      `Cold mail sent to ${company.company_name} for ${company.role}`,
      JSON.stringify({ companyId })
    );
    logger.info(`Cold mail sent to ${company.company_name}`, { source: "mail" });
    return true;
  } catch (e) {
    const errMsg = String(e);
    companyQueries.updateStatus(companyId, "approved", {
      error_message: errMsg,
    } as unknown as Partial<import("../../db/queries.js").Company>);
    activityQueries.add("mail_failed", `Mail to ${company.company_name} failed: ${errMsg}`, JSON.stringify({ companyId }));
    logger.error(`Mail failed: ${company.company_name}`, { error: errMsg, source: "mail" });
    return false;
  }
}

export function isGmailConfigured(): boolean {
  return !!(env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN);
}

export async function sendFollowUpMail(companyId: number, subject: string, body: string): Promise<boolean> {
  const company = companyQueries.getById(companyId);
  if (!company || company.status !== "mail_sent") return false;

  try {
    const transport = await getTransporter();
    const senderName = company.sender_name || getSenderName();
    const senderEmail = getSenderEmail();
    // In-reply-to would be better here, but since we don't store Message-ID, 
    // a basic RE: subject keeps it threaded in most modern clients
    const messageId = `<followup_${Date.now()}.${companyId}@jobos.local>`;
    await transport.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: company.hr_email,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, "<br>"),
      headers: {
        "Message-ID": messageId,
        "Reply-To": senderEmail,
      },
    });

    const now = new Date().toISOString();
    companyQueries.update(companyId, {
      followup_sent_at: now,
      followup_status: "sent"
    } as unknown as Partial<import("../../db/queries.js").Company>);

    activityQueries.add(
      "followup_sent",
      `Follow-up sent to ${company.company_name} for ${company.role}`,
      JSON.stringify({ companyId })
    );
    logger.info(`Follow-up sent to ${company.company_name}`, { source: "mail" });
    return true;
  } catch (e) {
    const errMsg = String(e);
    companyQueries.update(companyId, {
      followup_status: "failed",
      error_message: errMsg
    } as unknown as Partial<import("../../db/queries.js").Company>);
    activityQueries.add("followup_failed", `Follow-up to ${company.company_name} failed: ${errMsg}`, JSON.stringify({ companyId }));
    logger.error(`Follow-up failed: ${company.company_name}`, { error: errMsg, source: "mail" });
    return false;
  }
}
