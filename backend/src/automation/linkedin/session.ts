import { chromium, BrowserContext } from "playwright";
import fs from "fs";
import path from "path";
import { env } from "../../config/env.js";

export async function loadSession(): Promise<BrowserContext | null> {
  const cookiePath = env.LINKEDIN_COOKIES_PATH;
  if (!fs.existsSync(cookiePath)) return null;
  const cookies = JSON.parse(fs.readFileSync(cookiePath, "utf-8"));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies(cookies);
  return context;
}

export async function saveSession(context: BrowserContext): Promise<void> {
  const cookies = await context.cookies();
  const dir = path.dirname(env.LINKEDIN_COOKIES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(env.LINKEDIN_COOKIES_PATH, JSON.stringify(cookies, null, 2));
}

export function hasValidSession(): boolean {
  return fs.existsSync(env.LINKEDIN_COOKIES_PATH);
}
