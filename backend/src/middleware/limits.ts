import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.js";
import { ResumeVault as ResumeVaultModel, Company as CompanyModel, ActivityLog as ActivityLogModel } from "../db/models.js";

// Helper to get start of today
function getStartOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

// 1. Resume upload limit middleware
export async function checkResumeLimit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Pro users have unlimited resume uploads
  if (req.user.plan === "pro") {
    return next();
  }

  try {
    const count = await ResumeVaultModel.countDocuments({ userId: req.user.id });
    if (count >= 3) {
      return res.status(403).json({
        error: "Resume upload limit reached.",
        code: "LIMIT_RESUMES_EXCEEDED",
        message: "Free tier is limited to 3 resumes. Please upgrade to Pro for unlimited uploads."
      });
    }
    next();
  } catch (error) {
    console.error("Error checking resume limit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// 2. Cold email daily limit middleware
export async function checkColdMailLimit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.plan === "pro") {
    return next();
  }

  try {
    const startOfToday = getStartOfToday();
    const count = await CompanyModel.countDocuments({
      userId: req.user.id,
      sent_at: { $gte: startOfToday }
    });

    if (count >= 5) {
      return res.status(403).json({
        error: "Daily cold email limit reached.",
        code: "LIMIT_EMAILS_EXCEEDED",
        message: "Free tier is limited to 5 cold emails per day. Please upgrade to Pro for unlimited emails."
      });
    }
    next();
  } catch (error) {
    console.error("Error checking cold email limit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// 3. ATS check daily limit middleware
export async function checkAtsLimit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.plan === "pro") {
    return next();
  }

  try {
    const startOfToday = getStartOfToday();
    const count = await ActivityLogModel.countDocuments({
      userId: req.user.id,
      type: "ats_check",
      createdAt: { $gte: startOfToday }
    });

    if (count >= 3) {
      return res.status(403).json({
        error: "Daily ATS check limit reached.",
        code: "LIMIT_ATS_EXCEEDED",
        message: "Free tier is limited to 3 ATS checks per day. Please upgrade to Pro for unlimited checks."
      });
    }
    next();
  } catch (error) {
    console.error("Error checking ATS limit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
