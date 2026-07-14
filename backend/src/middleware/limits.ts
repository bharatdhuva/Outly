import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.js";
import { ResumeVault as ResumeVaultModel, Company as CompanyModel, ActivityLog as ActivityLogModel } from "../db/models.js";

// Helper to get start of today
function getStartOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

// 1. Resume upload limit middleware (Vault is completely free & unlimited)
export async function checkResumeLimit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return next();
}

// 2. Cold email rolling 12-hour limit middleware
export async function checkColdMailLimit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.plan === "pro") {
    return next();
  }

  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const count = await CompanyModel.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: twelveHoursAgo }
    });

    if (count >= 3) {
      return res.status(403).json({
        error: "Daily cold email limit reached.",
        code: "LIMIT_EMAILS_EXCEEDED",
        message: "Free tier is limited to 3 cold emails per 12 hours. Please upgrade to Pro for unlimited emails."
      });
    }
    next();
  } catch (error) {
    console.error("Error checking cold email limit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// 3. ATS check limit middleware (12-hour rolling window)
export async function checkAtsLimit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.plan === "pro") {
    return next();
  }

  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const checks = await ActivityLogModel.find({
      userId: req.user.id,
      type: "ats_check",
      createdAt: { $gte: twelveHoursAgo }
    }).sort({ createdAt: 1 }).limit(3).lean();

    if (checks.length >= 3) {
      // Unlock 12 hours after the oldest check in the window
      const oldestCheck = checks[0];
      const unlockAt = new Date(new Date(oldestCheck.createdAt).getTime() + 12 * 60 * 60 * 1000).toISOString();
      return res.status(403).json({
        error: "Resume check limit reached.",
        code: "LIMIT_ATS_EXCEEDED",
        message: "Free tier is limited to 3 ATS checks per 12 hours. Please upgrade to Pro for unlimited checks.",
        unlockAt
      });
    }
    next();
  } catch (error) {
    console.error("Error checking ATS limit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// 4. Resume tailoring limit middleware (12-hour rolling window)
export async function checkTailorLimit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.plan === "pro") {
    return next();
  }

  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const tailors = await ActivityLogModel.find({
      userId: req.user.id,
      type: "ats_tailor",
      createdAt: { $gte: twelveHoursAgo }
    }).sort({ createdAt: 1 }).limit(3).lean();

    if (tailors.length >= 3) {
      // Unlock 12 hours after the oldest tailoring in the window
      const oldestCheck = tailors[0];
      const unlockAt = new Date(new Date(oldestCheck.createdAt).getTime() + 12 * 60 * 60 * 1000).toISOString();
      return res.status(403).json({
        error: "Resume tailor limit reached.",
        code: "LIMIT_TAILOR_EXCEEDED",
        message: "Free tier is limited to 3 resume tailorings per 12 hours. Please upgrade to Pro for unlimited tailoring.",
        unlockAt
      });
    }
    next();
  } catch (error) {
    console.error("Error checking tailor limit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
