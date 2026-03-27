import { config } from "dotenv";
config({ path: ".env" });
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const cookiePath = path.join(dataDir, "linkedin-cookies.json");

  console.log("Opening Chromium for LinkedIn login...");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://www.linkedin.com/login");
  console.log("Please log in to LinkedIn in the browser window.");
  console.log("After logging in, press Enter here to save your session...");

  await new Promise<void>((resolve) => {
    process.stdin.once("data", () => resolve());
  });

  const cookies = await context.cookies();
  fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));
  console.log(`✅ Session saved to ${cookiePath}`);
  await browser.close();
  process.exit(0);
}

main();
