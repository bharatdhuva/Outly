import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });

import { sendUpgradeMail } from "../src/automation/coldmail/mailSender.js";

async function run() {
  console.log("Sending sample upgrade email to dhuvabharat05@gmail.com...");
  const success = await sendUpgradeMail("dhuvabharat05@gmail.com", "Bharat Dhuva");
  if (success) {
    console.log("✅ Sample upgrade email sent successfully!");
  } else {
    console.error("❌ Failed to send sample upgrade email.");
  }
  process.exit(0);
}

run();
