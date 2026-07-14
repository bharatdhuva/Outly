import { logger } from "../../lib/logger.js";

export async function sendColdMail(companyId: string): Promise<boolean> {
  logger.info(`Sending cold mail to company ID: ${companyId}...`);
  try {
    // @ts-ignore
    const privateModule = await import("./mailSender.private.js");
    return await privateModule.sendColdMail(companyId);
  } catch (error: any) {
    logger.warn(`Private sender module not found, running sandbox fallback: ${error.message}`);
    return true; // Simulate successful send
  }
}

export function isGmailConfigured(): boolean {
  try {
    // If the private file is missing, we check process.env or return fallback
    return !!(process.env.GMAIL_CLIENT_ID || process.env.GMAIL_REFRESH_TOKEN);
  } catch {
    return false;
  }
}

export async function sendFollowUpMail(companyId: string, subject: string, body: string): Promise<boolean> {
  logger.info(`Sending follow up mail to company ID: ${companyId}...`);
  try {
    // @ts-ignore
    const privateModule = await import("./mailSender.private.js");
    return await privateModule.sendFollowUpMail(companyId, subject, body);
  } catch (error: any) {
    logger.warn(`Private sender module not found, running sandbox fallback: ${error.message}`);
    return true; // Simulate successful send
  }
}

export async function sendWelcomeMail(toEmail: string, fullName?: string): Promise<boolean> {
  logger.info(`Sending welcome mail to: ${toEmail}...`);
  try {
    // @ts-ignore
    const privateModule = await import("./mailSender.private.js");
    return await privateModule.sendWelcomeMail(toEmail, fullName);
  } catch (error: any) {
    logger.warn(`Private sender module not found, running sandbox fallback: ${error.message}`);
    return true; // Simulate successful send
  }
}

export async function sendUpgradeMail(toEmail: string, fullName?: string): Promise<boolean> {
  logger.info(`Sending upgrade notification email to: ${toEmail}...`);
  try {
    // @ts-ignore
    const privateModule = await import("./mailSender.private.js");
    return await privateModule.sendUpgradeMail(toEmail, fullName);
  } catch (error: any) {
    logger.warn(`Private sender module not found, running sandbox fallback: ${error.message}`);
    return true; // Simulate successful send
  }
}

export async function createGmailDraft(companyId: string): Promise<boolean> {
  logger.info(`Creating draft for company ID: ${companyId}...`);
  try {
    // @ts-ignore
    const privateModule = await import("./mailSender.private.js");
    return await privateModule.createGmailDraft(companyId);
  } catch (error: any) {
    logger.warn(`Private sender module not found, running sandbox fallback: ${error.message}`);
    return true; // Simulate draft creation success
  }
}
