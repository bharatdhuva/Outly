import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    plan: "free" | "pro";
    fullName?: string;
    isDemo?: boolean;
    role?: "user" | "demo";
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      plan: decoded.plan || "free",
      fullName: decoded.fullName,
      isDemo: Boolean(decoded.isDemo),
      role: decoded.role || (decoded.isDemo ? "demo" : "user")
    };
    next();
  } catch (error: any) {
    if (error?.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired.", code: "DEMO_EXPIRED" });
    }
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}
