import winston from "winston";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";

// Detect serverless environment (Vercel has read-only filesystem)
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const transports: winston.transport[] = [];

if (!isServerless) {
  // File transports only work on writable filesystems (local dev, Render, etc.)
  const logsDir = env.LOGS_DIR;
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  transports.push(
    new winston.transports.File({ filename: path.join(logsDir, "error.log"), level: "error" }),
    new winston.transports.File({ filename: path.join(logsDir, "combined.log") }),
  );
}

// Always add console transport (works everywhere including serverless)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  })
);

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "outly" },
  transports,
});

// Store recent logs in memory for SSE streaming (last 500)
const recentLogs: Array<{ time: string; level: string; source: string; message: string }> = [];
const MAX_RECENT_LOGS = 500;

export function addLogToStream(level: string, source: string, message: string) {
  const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
  recentLogs.unshift({ time, level, source, message });
  if (recentLogs.length > MAX_RECENT_LOGS) recentLogs.pop();
}

export function getRecentLogs(filter?: string): typeof recentLogs {
  if (!filter || filter === "all") return recentLogs;
  if (filter === "error") return recentLogs.filter((l) => l.level === "error" || l.level === "warn");
  return recentLogs.filter((l) => l.source === filter);
}

// Wrap logger to also push to stream
const originalLog = logger.log.bind(logger);
// @ts-ignore
logger.log = function (level: string, message: string, ...args: any[]) {
  const msg = typeof message === "string" ? message : JSON.stringify(message);
  const meta = args[0] as { source?: string } | undefined;
  const source = meta?.source ?? "system";
  addLogToStream(level, source, msg);
  return originalLog(level, message, ...args);
};
