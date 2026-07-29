import cron from "node-cron";
import axios from "axios";
import { logger } from "../lib/logger.js";

export function scheduleKeepAliveCron() {
  const backendUrl = process.env.PUBLIC_BACKEND_URL || process.env.RENDER_EXTERNAL_URL || "https://www.outly.online/api";

  // Run every 10 minutes (* /10 * * * *)
  cron.schedule("*/10 * * * *", async () => {
    try {
      const pingEndpoint = backendUrl.endsWith("/ping")
        ? backendUrl
        : `${backendUrl.replace(/\/$/, "")}/auth/ping`;

      await axios.get(pingEndpoint, { timeout: 10000 });
      logger.info(`Keep-alive ping sent to ${pingEndpoint}`, { source: "keepalive" });
    } catch (err: any) {
      logger.warn(`Keep-alive ping failed: ${err?.message || err}`, { source: "keepalive" });
    }
  });

  logger.info("Keep-alive cron scheduled (runs every 10 mins)", { source: "keepalive" });
}
