import { config } from "dotenv";
config({ path: ".env" });
import twilio from "twilio";

async function main() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.YOUR_WHATSAPP_NUMBER;

  if (!sid || !token || !from || !to) {
    console.error("Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, YOUR_WHATSAPP_NUMBER in .env");
    process.exit(1);
  }

  const client = twilio(sid, token);
  await client.messages.create({
    from,
    to,
    body: "🔔 JobOS test — WhatsApp notifications are working!",
  });
  console.log("✅ Test message sent! Check your WhatsApp.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
