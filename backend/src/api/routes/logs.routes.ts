import { Router, Response } from "express";
import fs from "fs";
import path from "path";
import { getRecentLogs } from "../../lib/logger.js";
import { env } from "../../config/env.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";

const router = Router();

// Protect all log routes
router.use(requireAuth);

router.get("/stream", (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const filter = (req.query.filter as string) ?? "all";
  const userId = req.user.id;
  
  const getFilteredLogs = () => {
    const logs = getRecentLogs(filter);
    return logs.filter((l: any) => l.userId === userId);
  };

  res.write(`data: ${JSON.stringify(getFilteredLogs())}\n\n`);

  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify(getFilteredLogs())}\n\n`);
  }, 3000);

  req.on("close", () => clearInterval(interval));
});

router.get("/download", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const logPath = path.join(env.LOGS_DIR, "combined.log");
  if (!fs.existsSync(logPath)) {
    return res.status(404).json({ error: "No logs found" });
  }

  // Filter logs in memory before sending to user for security
  try {
    const fileContent = fs.readFileSync(logPath, "utf-8");
    const lines = fileContent.split("\n").filter(Boolean);
    const userId = req.user.id;
    
    const userLines = lines.filter(line => {
      try {
        const obj = JSON.parse(line);
        return obj.userId === userId;
      } catch {
        return false;
      }
    });

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", "attachment; filename=user-logs.txt");
    res.send(userLines.join("\n"));
  } catch (error) {
    res.status(500).json({ error: "Failed to process log file." });
  }
});

router.get("/recent", (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const filter = (req.query.filter as string) ?? "all";
  const search = (req.query.search as string) ?? "";
  const userId = req.user.id;

  let logs = getRecentLogs(filter).filter((l: any) => l.userId === userId);
  if (search) {
    const s = search.toLowerCase();
    logs = logs.filter((l: any) => l.message.toLowerCase().includes(s));
  }
  res.json(logs);
});

export default router;
