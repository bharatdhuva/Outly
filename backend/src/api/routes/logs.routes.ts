import { Router } from "express";
import fs from "fs";
import path from "path";
import { getRecentLogs } from "../../lib/logger.js";
import { env } from "../../config/env.js";

const router = Router();

router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const filter = (req.query.filter as string) ?? "all";
  const logs = getRecentLogs(filter);
  res.write(`data: ${JSON.stringify(logs)}\n\n`);

  const interval = setInterval(() => {
    const updated = getRecentLogs(filter);
    res.write(`data: ${JSON.stringify(updated)}\n\n`);
  }, 3000);

  req.on("close", () => clearInterval(interval));
});

router.get("/download", (_req, res) => {
  const logPath = path.join(env.LOGS_DIR, "combined.log");
  if (!fs.existsSync(logPath)) {
    return res.status(404).json({ error: "No logs found" });
  }
  res.download(logPath, "jobos-logs.txt");
});

router.get("/recent", (req, res) => {
  const filter = (req.query.filter as string) ?? "all";
  const search = (req.query.search as string) ?? "";
  let logs = getRecentLogs(filter);
  if (search) {
    const s = search.toLowerCase();
    logs = logs.filter((l) => l.message.toLowerCase().includes(s));
  }
  res.json(logs);
});

export default router;
