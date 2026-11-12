import cron from "node-cron";
import axios from "axios";
import { logger } from "../lib/logger.js";

async function pingTarget(url: string, label: string) {
  try {
    const res = await axios.get(url, { timeout: 12000 });
    logger.info(`Keep-alive ping sent to ${label} (${url}) [Status: ${res.status}]`, { source: "keepalive" });
  } catch (err: any) {
    logger.warn(`Keep-alive ping failed for ${label} (${url}): ${err?.message || err}`, { source: "keepalive" });
  }
}

export function scheduleKeepAliveCron() {
  const backendUrl = process.env.PUBLIC_BACKEND_URL || process.env.RENDER_EXTERNAL_URL || "https://www.outly.online/api";

  const nodePingUrl = backendUrl.endsWith("/ping")
    ? backendUrl
    : `${backendUrl.replace(/\/$/, "")}/auth/ping`;

  const pingAll = async () => {
    // Keep Node Backend awake (only needed if running on Render/non-serverless)
    await pingTarget(nodePingUrl, "Node Backend");
    // Python ATS is now serverless on Vercel — no keep-alive ping needed.
  };

  // Warm up immediately on boot
  pingAll().catch(() => {});

  // Run every 10 minutes to keep Node backend awake (if on Render)
  cron.schedule("*/10 * * * *", async () => {
    await pingAll();
  });

  logger.info(`Keep-alive cron scheduled (runs every 10 mins for Node backend at ${nodePingUrl})`, { source: "keepalive" });
}
