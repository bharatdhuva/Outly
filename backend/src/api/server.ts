import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import coldmailRoutes from "./routes/coldmail.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import atsRoutes from "./routes/ats.routes.js";
import applicationsRoutes from "./routes/applications.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import scraperRoutes from "./routes/scraper.routes.js";
import authRoutes from "./routes/auth.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes); // alias for compatibility with direct auth calls
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/coldmail", coldmailRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/ats", atsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/scraper", scraperRoutes);
app.use("/api", paymentRoutes);
app.use("/api/payment", paymentRoutes);

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
