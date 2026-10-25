import cron from "node-cron";
import axios from "axios";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

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
  const pythonBase = (env.PYTHON_ATS_URL || process.env.PYTHON_ATS_URL || "http://localhost:8000").replace(/\/$/, "");

  const nodePingUrl = backendUrl.endsWith("/ping")
    ? backendUrl
    : `${backendUrl.replace(/\/$/, "")}/auth/ping`;
  const pythonHealthUrl = `${pythonBase}/health`;

  const pingAll = async () => {
    // 1. Keep Node Backend awake
    await pingTarget(nodePingUrl, "Node Backend");

    // 2. Keep Python ATS Service awake
    await pingTarget(pythonHealthUrl, "Python ATS Service");
  };

  // Warm up immediately on boot
  pingAll().catch(() => {});

  // Run every 10 minutes to prevent Render free-tier idle shutdown
  cron.schedule("*/10 * * * *", async () => {
    await pingAll();
  });

  logger.info(`Keep-alive cron scheduled (runs every 10 mins for Node and Python ATS at ${pythonHealthUrl})`, { source: "keepalive" });
}
