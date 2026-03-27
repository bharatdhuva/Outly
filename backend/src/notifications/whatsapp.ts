import twilio from "twilio";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { notificationsQueries } from "../db/queries.js";
import { getWhatsAppNumber } from "../config/appSettings.js";

let client: twilio.Twilio | null = null;

const RATE_LIMIT = 10; // max messages per hour
const rateLimitWindow: number[] = [];

function canSend(): boolean {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const recent = rateLimitWindow.filter((t) => t > oneHourAgo);
  rateLimitWindow.length = 0;
  rateLimitWindow.push(...recent);
  return recent.length < RATE_LIMIT;
}

function recordSend() {
  rateLimitWindow.push(Date.now());
}

export async function sendWhatsApp(message: string, isCritical = false): Promise<boolean> {
  const toNumber = getWhatsAppNumber();
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !toNumber) {
    logger.warn("WhatsApp not configured", { source: "whatsapp" });
    return false;
  }

  if (!isCritical && !canSend()) {
    logger.warn("WhatsApp rate limit reached", { source: "whatsapp" });
    notificationsQueries.insert("rate_limited", message, "skipped");
    return false;
  }

  try {
    if (!client) {
      client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    }
    await client.messages.create({
      from: env.TWILIO_WHATSAPP_FROM,
      to: toNumber,
      body: message,
    });
    recordSend();
    notificationsQueries.insert("whatsapp", message, "sent");
    logger.info("WhatsApp sent", { message: message.slice(0, 50), source: "whatsapp" });
    return true;
  } catch (e) {
    logger.error("WhatsApp failed", { error: String(e), source: "whatsapp" });
    notificationsQueries.insert("whatsapp", message, "failed");
    return false;
  }
}

export function isWhatsAppConfigured(): boolean {
  return !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && getWhatsAppNumber());
}
