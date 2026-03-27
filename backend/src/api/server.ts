import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import coldmailRoutes from "./routes/coldmail.routes.js";
import linkedinRoutes from "./routes/linkedin.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import telegramRoutes from "./routes/telegram.routes.js";
import twitterRoutes from "./routes/twitter.routes.js";
import redditRoutes from "./routes/reddit.routes.js";

const app = express();
app.use(cors({ origin: `http://localhost:${env.CLIENT_PORT}`, credentials: true }));
app.use(express.json());

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/coldmail", coldmailRoutes);
app.use("/api/linkedin", linkedinRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/twitter", twitterRoutes);
app.use("/api/reddit", redditRoutes);

// Server frontend in production
const rootDir = process.cwd().endsWith("src") ? path.resolve(process.cwd(), "..") : process.cwd();
const clientPath = path.join(rootDir, "frontend", "dist");
if (env.NODE_ENV === "production" && fs.existsSync(clientPath)) {
  app.use(express.static(clientPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

export function startServer(): Promise<void> {
  return new Promise((resolve) => {
    app.listen(env.PORT, () => {
      console.log(`JobOS backend listening on http://localhost:${env.PORT}`);
      resolve();
    });
  });
}

export default app;
