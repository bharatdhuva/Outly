import nodemailer from "nodemailer";
import { google } from "googleapis";
import axios from "axios";
import { env } from "../../config/env.js";
import { companyQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";
import { activityQueries } from "../../db/queries.js";
import { getSenderEmail, getSenderName } from "../../config/appSettings.js";

let transporter: nodemailer.Transporter | null = null;

async function sendViaBrevo(options: {
  senderName: string;
  senderEmail: string;
  toEmail: string;
  subject: string;
  textContent: string;
  htmlContent: string;
}): Promise<boolean> {
  const apiKey = (process.env.BREVO_API_KEY || env.BREVO_API_KEY || "").trim();
  if (!apiKey) throw new Error("Brevo API key is missing");

  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: options.senderName || "Founder Outly", email: "founder@outly.online" },
      to: [{ email: options.toEmail }],
      subject: options.subject,
      textContent: options.textContent,
      htmlContent: options.htmlContent,
    },
    {
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        "accept": "application/json",
      },
    }
  );
  return !!response.data;
}

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

export async function sendColdMail(companyId: string): Promise<boolean> {
  const company = await companyQueries.getById(companyId);
  if (!company || company.status !== "approved") return false;
  if (!company.generated_subject || !company.generated_mail) return false;

  try {
    const senderName = company.sender_name || await getSenderName(company.userId);
    const senderEmail = getSenderEmail();
    const brevoKey = (process.env.BREVO_API_KEY || env.BREVO_API_KEY || "").trim();

    if (brevoKey) {
      await sendViaBrevo({
        senderName,
        senderEmail,
        toEmail: company.hr_email,
        subject: company.generated_subject,
        textContent: company.generated_mail,
        htmlContent: company.generated_mail.replace(/\n/g, "<br>"),
      });
    } else {
      const transport = await getTransporter();
      const messageId = `<${Date.now()}.${companyId}@outly.local>`;
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
    }

    const now = new Date();
    await companyQueries.updateStatus(companyId, "mail_sent", {
      sent_at: now,
      error_message: null,
    } as unknown as Partial<import("../../db/queries.js").Company>);

    await activityQueries.add(
      company.userId,
      "mail_sent",
      `Cold mail sent to ${company.company_name} for ${company.role}`,
      { companyId }
    );
    logger.info(`Cold mail sent to ${company.company_name}`, { source: "mail" });
    return true;
  } catch (e) {
    const errMsg = e && typeof e === "object" && "response" in e ? JSON.stringify((e as any).response?.data || e) : String(e);
    await companyQueries.updateStatus(companyId, "approved", {
      error_message: errMsg,
    } as unknown as Partial<import("../../db/queries.js").Company>);
    await activityQueries.add(
      company.userId,
      "mail_failed",
      `Mail to ${company.company_name} failed: ${errMsg}`,
      { companyId }
    );
    logger.error(`Mail failed: ${company.company_name}`, { error: errMsg, source: "mail" });
    return false;
  }
}

export function isGmailConfigured(): boolean {
  return !!(process.env.BREVO_API_KEY || env.BREVO_API_KEY || (env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN));
}

export async function sendFollowUpMail(companyId: string, subject: string, body: string): Promise<boolean> {
  const company = await companyQueries.getById(companyId);
  if (!company || company.status !== "mail_sent") return false;

  try {
    const senderName = company.sender_name || await getSenderName(company.userId);
    const senderEmail = getSenderEmail();
    const brevoKey = (process.env.BREVO_API_KEY || env.BREVO_API_KEY || "").trim();

    if (brevoKey) {
      await sendViaBrevo({
        senderName,
        senderEmail,
        toEmail: company.hr_email,
        subject: subject,
        textContent: body,
        htmlContent: body.replace(/\n/g, "<br>"),
      });
    } else {
      const transport = await getTransporter();
      const messageId = `<followup_${Date.now()}.${companyId}@outly.local>`;
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
    }

    const now = new Date();
    await companyQueries.update(companyId, {
      followup_sent_at: now,
      followup_status: "sent"
    } as unknown as Partial<import("../../db/queries.js").Company>);

    await activityQueries.add(
      company.userId,
      "followup_sent",
      `Follow-up sent to ${company.company_name} for ${company.role}`,
      { companyId }
    );
    logger.info(`Follow-up sent to ${company.company_name}`, { source: "mail" });
    return true;
  } catch (e) {
    const errMsg = String(e);
    await companyQueries.update(companyId, {
      followup_status: "failed",
      error_message: errMsg
    } as unknown as Partial<import("../../db/queries.js").Company>);
    await activityQueries.add(
      company.userId,
      "followup_failed",
      `Follow-up to ${company.company_name} failed: ${errMsg}`,
      { companyId }
    );
    logger.error(`Follow-up failed: ${company.company_name}`, { error: errMsg, source: "mail" });
    return false;
  }
}

export async function sendWelcomeMail(toEmail: string, fullName?: string): Promise<boolean> {
  try {
    const name = fullName || toEmail.split("@")[0];
    const subject = `Welcome to Outly! 🚀`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
        <style type="text/css">
          body, table, td, a{-webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;}
          table, td{mso-table-lspace: 0pt; mso-table-rspace: 0pt;}
          img{-ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none;}
          table{border-collapse: collapse !important;}
          body{height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #fafafa; font-family: Arial, Helvetica, sans-serif; color: #1a1a1a;}
          @media screen and (max-width: 665px) {
            .wrapper { width: 100% !important; max-width: 100% !important; }
            .padding2 { padding: 15px 20px !important; }
            .logo-header { padding: 18px 15px 12px !important; }
            .logo-img { width: 115px !important; max-height: 36px !important; }
            .mobile-link-td { padding-top: 4px !important; font-size: 12px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #fafafa;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; padding: 30px 10px;">
          <tr>
            <td bgcolor="#fafafa" align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e8e2d5; box-shadow: 0 4px 12px rgba(0,0,0,0.03);" class="wrapper">
                
                <!-- LOGO HEADER -->
                <tr>
                  <td align="center" valign="top" width="100%" style="border-bottom: 1px solid #e8e2d5; padding: 22px 30px 16px;" class="logo-header">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="left" valign="middle">
                          <a href="https://outly.online" target="_blank" style="display: inline-block;">
                            <img src="https://res.cloudinary.com/dmgd1iunu/image/upload/v1782581584/outly_brand/outly_logo.png" alt="Outly" width="125" style="display: block; border: 0; outline: none; height: auto; max-height: 40px; width: 125px; object-fit: contain;" class="logo-img" />
                          </a>
                        </td>
                        <td align="right" valign="middle" class="mobile-link-td">
                          <a href="https://outly.online" target="_blank" style="color: #2dc08d; text-decoration: none; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold;">www.outly.online</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CONTENT BODY -->
                <tr>
                  <td style="padding: 30px 35px 20px;" class="padding2">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left" style="font-size: 16px; line-height: 24px; font-family: Arial, sans-serif; color: #1a1a1a; padding-bottom: 16px;">
                          Hi ${name},
                        </td>
                      </tr>
                      <tr>
                        <td align="left" style="font-size: 18px; font-weight: bold; line-height: 26px; font-family: Arial, sans-serif; color: #1a1a1a; padding-bottom: 16px;">
                          Welcome to Outly! 🎉
                        </td>
                      </tr>
                      <tr>
                        <td align="left" style="font-size: 15px; line-height: 24px; font-family: Arial, sans-serif; color: #333333; padding-bottom: 16px;">
                          I'm Bharat, founder of Outly.
                        </td>
                      </tr>
                      <tr>
                        <td align="left" style="font-size: 15px; line-height: 25px; font-family: Arial, sans-serif; color: #333333; padding-bottom: 16px;">
                          We're building a space where people can showcase their skills, pursue their hobbies, and grow together — your career and your passion, all in one place.
                        </td>
                      </tr>
                      <tr>
                        <td align="left" style="font-size: 15px; line-height: 24px; font-family: Arial, sans-serif; color: #333333; padding-bottom: 16px;">
                          Glad to have you here early.
                        </td>
                      </tr>
                      <tr>
                        <td align="left" style="font-size: 15px; line-height: 25px; font-family: Arial, sans-serif; color: #333333; padding-bottom: 20px;">
                          Complete your profile, explore the community, and don’t hesitate to share your feedback. I read every message personally.
                        </td>
                      </tr>
                      <tr>
                        <td align="left" style="font-size: 16px; font-weight: bold; line-height: 24px; font-family: Arial, sans-serif; color: #2dc08d; padding-bottom: 24px;">
                          Let’s build something awesome together.
                        </td>
                      </tr>
                      <tr>
                        <td align="left" style="font-size: 15px; line-height: 22px; font-family: Arial, sans-serif; color: #333333; padding-bottom: 10px; border-top: 1px dashed #e8e2d5; padding-top: 20px;">
                          Cheers,<br/>
                          <strong style="color: #1a1a1a; font-size: 16px;">Bharat</strong><br/>
                          <span style="color: #666666; font-size: 14px;">Founder, Outly</span><br/>
                          <a href="https://outly.online" target="_blank" style="color: #2dc08d; text-decoration: underline; font-weight: bold; font-size: 14px;">www.outly.online</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- FOOTER / SUPPORT -->
                <tr>
                  <td style="border-top: 1px solid #e8e2d5; padding: 18px 35px; background-color: #fcfbf9;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left" style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 20px;">
                          <strong style="color: #1a1a1a;">Outly Support</strong><br/>
                          <a href="mailto:bharatdhuva27@gmail.com" style="color: #0066cc; text-decoration: underline;">bharatdhuva27@gmail.com</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const brevoKey = (process.env.BREVO_API_KEY || env.BREVO_API_KEY || "").trim();
    if (brevoKey) {
      await sendViaBrevo({
        senderName: "Founder Outly",
        senderEmail: "founder@outly.online",
        toEmail,
        subject,
        textContent: `Hi ${name},\nWelcome to Outly! 🎉\nI'm Bharat, founder of Outly.\nWe're building a space where people can showcase their skills, pursue their hobbies, and grow together — your career and your passion, all in one place.\nGlad to have you here early.\nComplete your profile, explore the community, and don’t hesitate to share your feedback. I read every message personally.\nLet’s build something awesome together.\n\nCheers,\nBharat\nFounder, Outly\nwww.outly.online\nOutly Support: bharatdhuva27@gmail.com`,
        htmlContent,
      });
    } else {
      const transport = await getTransporter();
      await transport.sendMail({
        from: `"Founder Outly" <founder@outly.online>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
    }
    logger.info(`Welcome email sent to ${toEmail}`, { source: "mail" });
    return true;
  } catch (err) {
    logger.error(`Failed to send welcome email to ${toEmail}`, { error: String(err), source: "mail" });
    return false;
  }
}

export async function sendUpgradeMail(toEmail: string, fullName?: string): Promise<boolean> {
  try {
    const name = fullName || toEmail.split("@")[0];
    const subject = `Welcome to Outly Cloud Pro! 🚀 (A message from our founder)`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
        <style type="text/css">
          body, table, td, a{-webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;}
          table, td{mso-table-lspace: 0pt; mso-table-rspace: 0pt;}
          img{-ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none;}
          table{border-collapse: collapse !important;}
          body{height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #fafafa; font-family: Arial, Helvetica, sans-serif; color: #1a1a1a;}
          @media screen and (max-width: 665px) {
            .wrapper { width: 100% !important; max-width: 100% !important; }
            .padding2 { padding: 15px 20px !important; }
            .logo-header { padding: 18px 15px 12px !important; }
            .logo-img { width: 115px !important; max-height: 36px !important; }
            .mobile-link-td { padding-top: 4px !important; font-size: 12px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #fafafa;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; padding: 30px 10px;">
          <tr>
            <td bgcolor="#fafafa" align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e8e2d5; box-shadow: 0 4px 12px rgba(0,0,0,0.03);" class="wrapper">
                
                <!-- LOGO HEADER -->
                <tr>
                  <td align="center" valign="top" width="100%" style="border-bottom: 1px solid #e8e2d5; padding: 22px 30px 16px;" class="logo-header">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="left" valign="middle">
                          <a href="https://outly.online" target="_blank" style="display: inline-block;">
                            <img src="https://res.cloudinary.com/dmgd1iunu/image/upload/v1782581584/outly_brand/outly_logo.png" alt="Outly" width="125" style="display: block; border: 0; outline: none; height: auto; max-height: 40px; width: 125px; object-fit: contain;" class="logo-img" />
                          </a>
                        </td>
                        <td align="right" valign="middle" class="mobile-link-td">
                          <span style="background-color: rgba(45,192,141,0.15); color: #2dc08d; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">Cloud Pro Active</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CONTENT BODY -->
                <tr>
                  <td style="padding: 30px 35px 20px;" class="padding2">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left" style="font-size: 16px; line-height: 24px; font-family: Arial, sans-serif; color: #1a1a1a; padding-bottom: 16px;">
                          Hi ${name},
                        </td>
                      </tr>
                      <tr>
                        <td align="left" style="font-size: 20px; font-weight: bold; line-height: 28px; font-family: Arial, sans-serif; color: #1a1a1a; padding-bottom: 16px;">
                          Welcome to Outly Cloud Pro! 🚀
                        </td>
                      </tr>
                      <tr>
                        <td align="left" style="font-size: 15px; line-height: 25px; font-family: Arial, sans-serif; color: #333333; padding-bottom: 16px;">
                          Thank you so much for upgrading your account. I’m <strong>Bharat Dhuva</strong>, creator of Outly. I built Outly with one mission: to eliminate manual job application stress so ambitious candidates can land top interviews on autopilot.
                        </td>
                      </tr>
                      <tr>
                        <td align="left" style="font-size: 15px; line-height: 25px; font-family: Arial, sans-serif; color: #333333; padding-bottom: 20px;">
                          Your support means the world to our team and helps us continually train faster, sharper AI models for your job search.
                        </td>
                      </tr>
                      
                      <!-- UNLOCKED FEATURES BOX -->
                      <tr>
                        <td style="padding-bottom: 24px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7fbf9; border: 1px solid #cceee2; border-radius: 10px; padding: 20px;">
                            <tr>
                              <td style="font-size: 14px; font-weight: bold; color: #2dc08d; font-family: Arial, sans-serif; padding-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                ✨ What’s Now Unlocked On Your Account:
                              </td>
                            </tr>
                            <tr>
                              <td style="font-size: 14px; line-height: 22px; color: #222222; font-family: Arial, sans-serif; padding-bottom: 8px;">
                                ✔ <strong>Unlimited ATS Resume Tailoring & Scoring:</strong> Tailor your CV to match any job description instantly.
                              </td>
                            </tr>
                            <tr>
                              <td style="font-size: 14px; line-height: 22px; color: #222222; font-family: Arial, sans-serif; padding-bottom: 8px;">
                                ✔ <strong>Automated Cold Email Engine:</strong> Reach verified hiring managers with AI-personalized outreach.
                              </td>
                            </tr>
                            <tr>
                              <td style="font-size: 14px; line-height: 22px; color: #222222; font-family: Arial, sans-serif; padding-bottom: 8px;">
                                ✔ <strong>AI Job Search & Visual Tracker:</strong> Discover matching roles and auto-track your application funnel.
                              </td>
                            </tr>
                            <tr>
                              <td style="font-size: 14px; line-height: 22px; color: #222222; font-family: Arial, sans-serif;">
                                ✔ <strong>Priority AI Model Queue:</strong> Fastest response times for your resumes and email generations.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td align="left" style="font-size: 15px; line-height: 25px; font-family: Arial, sans-serif; color: #333333; padding-bottom: 20px;">
                          As a Cloud Pro member, you also get direct priority support from me. If you ever have questions or feature suggestions, simply reply to this email—I read every message personally.
                        </td>
                      </tr>

                      <!-- CTA BUTTON -->
                      <tr>
                        <td align="center" style="padding-bottom: 28px;">
                          <a href="https://outly.online/ats-score" target="_blank" style="background-color: #2dc08d; color: #ffffff; text-decoration: none; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; padding: 14px 28px; border-radius: 30px; display: inline-block; box-shadow: 0 4px 14px rgba(45,192,141,0.3);">Launch Outly Pro Tools →</a>
                        </td>
                      </tr>

                      <tr>
                        <td align="left" style="font-size: 15px; line-height: 22px; font-family: Arial, sans-serif; color: #333333; padding-bottom: 10px; border-top: 1px dashed #e8e2d5; padding-top: 20px;">
                          Cheers & best of luck with your career,<br/>
                          <strong style="color: #1a1a1a; font-size: 16px;">Bharat Dhuva</strong><br/>
                          <span style="color: #666666; font-size: 14px;">Founder & CEO, Outly</span><br/>
                          <a href="https://outly.online" target="_blank" style="color: #2dc08d; text-decoration: underline; font-weight: bold; font-size: 14px;">www.outly.online</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- FOOTER / SUPPORT -->
                <tr>
                  <td style="border-top: 1px solid #e8e2d5; padding: 18px 35px; background-color: #fcfbf9;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left" style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 20px;">
                          <strong style="color: #1a1a1a;">Outly Founder Support</strong><br/>
                          <a href="mailto:bharatdhuva27@gmail.com" style="color: #0066cc; text-decoration: underline;">bharatdhuva27@gmail.com</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const brevoKey = (process.env.BREVO_API_KEY || env.BREVO_API_KEY || "").trim();
    if (brevoKey) {
      await sendViaBrevo({
        senderName: "Bharat Dhuva (Founder @ Outly)",
        senderEmail: "founder@outly.online",
        toEmail,
        subject,
        textContent: `Hi ${name},\nWelcome to Outly Cloud Pro! 🚀\nThank you so much for upgrading your account. I'm Bharat Dhuva, founder of Outly.\nWhat's unlocked: Unlimited ATS Resume Tailoring, Automated Cold Emails, AI Job Search & Tracker, and Priority AI Queue.\nIf you have any questions or feedback, reply to this email!\n\nCheers,\nBharat Dhuva\nFounder, Outly\nwww.outly.online`,
        htmlContent,
      });
    } else {
      const transport = await getTransporter();
      await transport.sendMail({
        from: `"Bharat Dhuva (Founder @ Outly)" <founder@outly.online>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
    }
    logger.info(`Upgrade thank-you email sent to ${toEmail}`, { source: "mail" });
    return true;
  } catch (err) {
    logger.error(`Failed to send upgrade email to ${toEmail}`, { error: String(err), source: "mail" });
    return false;
  }
}

export async function createGmailDraft(companyId: string): Promise<boolean> {
  const company = await companyQueries.getById(companyId);
  if (!company || !company.generated_subject || !company.generated_mail) return false;

  try {
    const oauth2Client = new google.auth.OAuth2(
      env.GMAIL_CLIENT_ID,
      env.GMAIL_CLIENT_SECRET,
      env.GMAIL_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const senderName = company.sender_name || await getSenderName(company.userId);
    const senderEmail = getSenderEmail();

    const rawMessage = [
      `From: "${senderName}" <${senderEmail}>`,
      `To: ${company.hr_email}`,
      `Subject: ${company.generated_subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      ``,
      company.generated_mail,
    ].join("\n");

    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: {
          raw: encodedMessage,
        },
      },
    });
    logger.info(`Created Gmail API draft for company ${companyId}`, { source: "mail" });
    return true;
  } catch (err) {
    logger.error(`Failed to create Gmail API draft for company ${companyId}`, { error: String(err), source: "mail" });
    throw err;
  }
}

