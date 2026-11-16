import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.js";
import { ActivityLog as ActivityLogModel, User as UserModel } from "../db/models.js";

/**
 * Middleware that checks if a user is a demo user and verifies session expiry.
 */
export async function verifyDemoSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.user.isDemo) {
    return next();
  }

  try {
    const user = await UserModel.findById(req.user.id).lean();
    if (!user) {
      return res.status(401).json({
        error: "Demo session expired.",
        code: "DEMO_EXPIRED",
        message: "Your demo session has expired. Sign in to keep going."
      });
    }

    if (user.demoExpiresAt && new Date() > new Date(user.demoExpiresAt)) {
      return res.status(401).json({
        error: "Demo session expired.",
        code: "DEMO_EXPIRED",
        message: "Your 25-minute demo session has ended. Create a free account to continue!"
      });
    }

    next();
  } catch (err) {
    console.error("Error verifying demo session:", err);
    next();
  }
}

/**
 * Blocks demo users completely from accessing sensitive or permanent actions
 * (sending emails, modifying settings, billing, exporting data, connecting Gmail, etc.)
 */
export function blockDemo(actionDescription = "This feature is locked in Demo mode.") {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.isDemo) {
      return res.status(403).json({
        error: actionDescription,
        code: "DEMO_LIMIT_REACHED",
        message: `${actionDescription} Sign up with Google to unlock full access.`
      });
    }
    next();
  };
}

/**
 * Enforces per-feature limits for demo users:
 * - 1 ATS check
 * - 1 Resume tailor
 * - 1 Cold email generation
 * - 1 Resume upload
 */
export function checkDemoQuota(feature: "ats_check" | "ats_tailor" | "coldmail_generate" | "resume_upload") {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.isDemo) {
      return next();
    }

    try {
      const count = await ActivityLogModel.countDocuments({
        userId: req.user.id,
        type: { $in: [feature, `demo_${feature}`] }
      });

      if (count >= 1) {
        const featureNames: Record<string, string> = {
          ats_check: "ATS check",
          ats_tailor: "resume tailor",
          coldmail_generate: "cold email draft",
          resume_upload: "resume upload"
        };
        const name = featureNames[feature] || "action";

        return res.status(403).json({
          error: `Demo limit reached for ${name}.`,
          code: "DEMO_LIMIT_REACHED",
          message: `Demo users get 1 free ${name}. Like what you see? Sign in with Google to unlock unlimited access!`
        });
      }

      next();
    } catch (err) {
      console.error("Error checking demo quota:", err);
      next();
    }
  };
}
