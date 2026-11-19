import { Router, Response } from "express";
import axios from "axios";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User, Company, Application, ResumeVault, ActivityLog } from "../../db/models.js";
import { env } from "../../config/env.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";
import { connectDB } from "../../db/connection.js";
import { sendWelcomeMail, sendUpgradeMail } from "../../automation/coldmail/mailSender.js";
import { logger } from "../../lib/logger.js";
import mongoose from "mongoose";

const router = Router();

// In-memory rate limiter & one-time visitor tracker for /auth/demo
const demoIpLimiter = new Map<string, { count: number; resetAt: number }>();
const usedDemoVisitors = new Set<string>();

// Async helper to clean up expired demo accounts and cascade-delete their data
async function cleanupExpiredDemoData() {
  try {
    const expiredUsers = await User.find({
      isDemo: true,
      demoExpiresAt: { $lt: new Date() }
    }).select("_id").lean();

    if (expiredUsers.length > 0) {
      const ids = expiredUsers.map((u) => u._id);
      await Promise.all([
        Company.deleteMany({ userId: { $in: ids } }),
        Application.deleteMany({ userId: { $in: ids } }),
        ResumeVault.deleteMany({ userId: { $in: ids } }),
        ActivityLog.deleteMany({ userId: { $in: ids } }),
        User.deleteMany({ _id: { $in: ids } })
      ]);
    }
  } catch (err) {
    logger.warn("Demo data cleanup warning:", { error: String(err) });
  }
}

// GET /ping (Health check to wake up the serverless function & database)
router.get("/ping", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.json({ status: "ok", database: dbStatus, timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: "error", message: err instanceof Error ? err.message : String(err) });
  }
});

// 0. POST /demo (Ephemeral guest demo user with sample data)
router.post("/demo", async (req, res) => {
  try {
    await connectDB();

    // Trigger background cleanup of expired demo accounts
    cleanupExpiredDemoData().catch(() => {});

    // Create ephemeral demo user
    const now = Date.now();
    const randomHex = crypto.randomBytes(4).toString("hex");
    const demoEmail = `demo-${randomHex}@outly.demo`;
    const demoPasswordHash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 8);
    const demoLifespanMs = 25 * 60 * 1000; // 25 minutes
    const expiresAt = new Date(now + demoLifespanMs);

    const user = new User({
      email: demoEmail,
      passwordHash: demoPasswordHash,
      fullName: "Alex (Demo)",
      profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
      role: "demo",
      isDemo: true,
      demoExpiresAt: expiresAt,
      plan: "free"
    });

    await user.save();

    // 4. Seed sample fake data
    // Sample Resume in Vault
    await ResumeVault.create({
      userId: user._id,
      filename: "Alex_Morgan_Senior_Software_Engineer.pdf",
      label: "Target: Staff / Lead Engineer",
      content: `Alex Morgan
Staff Full-Stack Engineer
San Francisco, CA | alex@example.com | github.com/alexmorgan

SUMMARY
Staff Full-Stack Engineer with 7+ years of experience architecting high-throughput distributed systems and responsive React web applications. Proven track record reducing p99 latency by 42% and scaling platforms to 50M+ daily events.

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, Go, SQL
Frontend: React, Next.js, Redux, Tailwind CSS, Framer Motion
Backend: Node.js, Express, PostgreSQL, MongoDB, Redis, REST, GraphQL
DevOps & Cloud: AWS (ECS, S3, RDS), Docker, GitHub Actions, Microservices

WORK EXPERIENCE
Staff Software Engineer | Acme Cloud Systems (2022 - Present)
- Architected event-driven microservices processing 50M+ requests/day with 99.99% uptime.
- Led the redesign of core frontend dashboards in React/TypeScript, cutting load times by 55%.
- Mentored 6 mid-level and senior engineers, improving team shipping velocity by 30%.

Senior Full-Stack Engineer | HyperScale Tech (2019 - 2022)
- Built automated cold outreach pipelines with Express and BullMQ, handling 100k+ emails monthly.
- Optimized Elasticsearch search queries, reducing response times from 450ms to 75ms.

EDUCATION
B.S. in Computer Science | UC Berkeley (2015 - 2019)`,
      is_default: 1
    });

    // Sample ATS Check in ActivityLog
    await ActivityLog.create({
      userId: user._id,
      type: "ats_check",
      message: "Scored resume for 'Staff Full-Stack Engineer' (ATS Score: 88%)",
      meta: JSON.stringify({ score: 88, target: "Staff Full-Stack Engineer" })
    });

    // Sample Companies in Cold Outreach Pipeline
    await Company.create([
      {
        userId: user._id,
        company_name: "Stripe",
        role: "Staff Infrastructure Engineer",
        hr_email: "recruiting-team@stripe-demo.fake",
        target_person_name: "Sarah Chen",
        target_person_role: "Head of Infrastructure Recruiting",
        status: "drafted",
        generated_subject: "Quick note on Stripe's core payment reliability & high-throughput scaling",
        generated_mail: "Hi Sarah,\n\nI've been following Stripe's latest architecture notes on global idempotency and was really impressed by how the core billing engines handle cross-region consistency.\n\nAt my current role, I led the pipeline redesign that cut p99 latency by 42% across 50M daily events. Would love to connect briefly if your infrastructure group is exploring staff talent.\n\nBest,\nAlex",
        personalization_hook: "Spoke about global idempotency and low-latency distributed pipeline scale.",
      },
      {
        userId: user._id,
        company_name: "Linear",
        role: "Product Engineer",
        hr_email: "careers@linear-demo.fake",
        target_person_name: "Karri Saarinen",
        target_person_role: "Design & Product Lead",
        status: "pending",
        generated_subject: "Crafting fluid, keyboard-first web interfaces",
        generated_mail: "Hi Karri,\n\nLinear's obsession with sub-50ms UI response times and tactile interaction details sets the industry standard. I've spent the past 4 years building high-frequency React/TypeScript apps with extreme focus on render performance.\n\nWould love 10 minutes to share how I can contribute to upcoming projects.\n\nCheers,\nAlex",
        personalization_hook: "Focus on keyboard-first design and 60fps interaction polish.",
      },
      {
        userId: user._id,
        company_name: "OpenAI",
        role: "Full-Stack AI Platform Engineer",
        hr_email: "talent@openai-demo.fake",
        target_person_name: "David Kim",
        target_person_role: "Engineering Manager",
        status: "replied",
        sent_at: new Date(now - 24 * 60 * 60 * 1000),
        reply_detected_at: new Date(now - 4 * 60 * 60 * 1000),
        generated_subject: "Scaling real-time generative interfaces",
        generated_mail: "Hi David, saw the Canvas launch — inspiring design. I would love to connect about low-latency streaming UX.",
      }
    ]);

    // Sample Applications in Job Tracker
    await Application.create([
      {
        userId: user._id,
        company: "Google",
        role: "Staff Software Engineer",
        stage: "interview",
        resume_version_used: "Alex_Morgan_Senior_Software_Engineer.pdf",
        notes: "Round 2 technical architecture interview scheduled for tomorrow 10:00 AM PST.",
      },
      {
        userId: user._id,
        company: "Linear",
        role: "Product Engineer",
        stage: "applied",
        resume_version_used: "Alex_Morgan_Senior_Software_Engineer.pdf",
        notes: "Takehome submitted. Awaiting feedback from engineering team.",
      },
      {
        userId: user._id,
        company: "Stripe",
        role: "Senior Fullstack Engineer",
        stage: "offer",
        resume_version_used: "Alex_Morgan_Senior_Software_Engineer.pdf",
        notes: "Offer extended: $210k base + equity. Decision deadline next Friday.",
      }
    ]);

    // Issue short-lived JWT (25 minutes)
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        plan: "free",
        role: "demo",
        isDemo: true,
        fullName: user.fullName,
        demoExpiresAt: expiresAt.toISOString()
      },
      env.JWT_SECRET,
      { expiresIn: "25m" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic,
        plan: user.plan,
        role: "demo",
        isDemo: true,
        demoExpiresAt: expiresAt.toISOString(),
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error("Demo creation error:", { error: error instanceof Error ? error.stack || error.message : error });
    res.status(500).json({ error: "Failed to create demo session. Please try again." });
  }
});

// 1. SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      email: emailNormalized,
      passwordHash,
      fullName: fullName || "",
      plan: "free"
    });

    await user.save();

    // Trigger Welcome Email asynchronously in background
    sendWelcomeMail(user.email, user.fullName || undefined).catch((err) =>
      console.error("Welcome email trigger error:", err)
    );

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email, 
        plan: user.plan, 
        fullName: user.fullName 
      },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic || "",
        plan: user.plan,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    // Log full stack for diagnostics in production logs
    logger.error("Signup error:", { error: error instanceof Error ? error.stack || error.message : error });

    // Mongo duplicate key error (race or unique index violation)
    // Error code 11000 is returned by MongoDB for duplicate key
    // Return a friendly 409 Conflict so the client can show appropriate message
    // Do not leak internal details to the client.
    const anyErr = error as any;
    if (anyErr && (anyErr.code === 11000 || (anyErr.name === "MongoError" && anyErr.code === 11000))) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    res.status(500).json({ error: "Failed to create user account." });
  }
});

// 2. LOGIN
router.post("/google", async (req, res) => {
  try {
    const { access_token: accessToken, credential } = req.body;
    const googleToken = accessToken ?? credential;

    if (!googleToken) {
      return res.status(400).json({ error: "Missing Google credential." });
    }

    let payload: { email?: string; email_verified?: string; aud?: string; name?: string; picture?: string } | null = null;

    if (typeof googleToken === "string" && googleToken.split(".").length === 3) {
      const verificationUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(googleToken)}`;
      const tokenInfoResponse = await axios.get(verificationUrl);
      payload = tokenInfoResponse.data;
    } else {
      try {
        const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${googleToken}` },
        });
        payload = userInfoResponse.data;
      } catch {
        const userInfoResponse = await axios.get("https://openidconnect.googleapis.com/v1/userinfo", {
          headers: { Authorization: `Bearer ${googleToken}` },
        });
        payload = userInfoResponse.data;
      }
    }

    if (!payload?.email) {
      return res.status(400).json({ error: "Invalid Google credential." });
    }

    const emailNormalized = payload.email.toLowerCase();
    let user = await User.findOne({ email: emailNormalized });

    const googlePhoto = payload.picture || "";

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), saltRounds);

      user = new User({
        email: emailNormalized,
        passwordHash,
        fullName: payload.name || "",
        profilePic: googlePhoto,
        plan: "free"
      });

      await user.save();

      // Trigger Welcome Email for new Google account creation
      sendWelcomeMail(user.email, user.fullName || undefined).catch((err) =>
        console.error("Google welcome email trigger error:", err)
      );
    } else {
      let needsSave = false;
      if (googlePhoto && user.profilePic !== googlePhoto) {
        user.profilePic = googlePhoto;
        needsSave = true;
      }
      if (payload.name && user.fullName !== payload.name) {
        user.fullName = payload.name;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        plan: user.plan,
        fullName: user.fullName,
      },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic || "",
        plan: user.plan,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    logger.error("Google login error:", { error: error instanceof Error ? error.stack || error.message : error });
    res.status(500).json({ error: "Failed to log in with Google." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email, 
        plan: user.plan, 
        fullName: user.fullName 
      },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic || "",
        plan: user.plan,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error("Login error:", { error: error instanceof Error ? error.stack || error.message : error });
    res.status(500).json({ error: "Failed to log in." });
  }
});

// 3. GET CURRENT USER PROFILE
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic || "",
        plan: user.plan,
        role: (user as any).role || "user",
        isDemo: Boolean((user as any).isDemo),
        demoExpiresAt: (user as any).demoExpiresAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to retrieve user session." });
  }
});

router.get("/gmail/url", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.isDemo) {
    return res.status(403).json({
      error: "Connecting Gmail is not permitted in demo mode.",
      code: "DEMO_LIMIT_REACHED",
      message: "Gmail connection is locked for guest demo accounts. Sign up with Google to connect your real Gmail account."
    });
  }

  const { google } = await import("googleapis");
  const oauth2Client = new google.auth.OAuth2(
    env.GMAIL_CLIENT_ID,
    env.GMAIL_CLIENT_SECRET,
    env.GMAIL_REDIRECT_URI
  );
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://mail.google.com/",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
  });
  res.json({ url });
});

router.get("/gmail/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) return res.status(400).send("No code provided");

    const { google } = await import("googleapis");
    const oauth2Client = new google.auth.OAuth2(
      env.GMAIL_CLIENT_ID,
      env.GMAIL_CLIENT_SECRET,
      env.GMAIL_REDIRECT_URI
    );
    const { tokens } = await oauth2Client.getToken(code);
    res.send(`
      <h2>Gmail Authorization Successful!</h2>
      <p>Here is your Refresh Token (Copy and add this to your backend .env file as <b>GMAIL_REFRESH_TOKEN</b>):</p>
      <pre style="background: #eee; padding: 10px; border-radius: 5px; word-break: break-all;">${tokens.refresh_token || tokens.access_token}</pre>
    `);
  } catch (e) {
    res.status(500).send("Gmail Auth failed: " + String(e));
  }
});

router.post("/upgrade", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.isDemo) {
      return res.status(403).json({
        error: "Cannot upgrade demo user directly.",
        code: "DEMO_LIMIT_REACHED",
        message: "Please sign in with your real Google account to subscribe to Outly Pro."
      });
    }

    const { plan } = req.body;
    const targetPlan = plan === "pro" ? "pro" : "free";

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          plan: targetPlan,
          planExpiresAt: targetPlan === "pro" ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) : null
        } 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetPlan === "pro") {
      sendUpgradeMail(user.email, user.fullName || undefined).catch((err) =>
        console.error("Upgrade thank-you email trigger error:", err)
      );
    }

    // Sign a new token with the updated plan
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email, 
        plan: user.plan, 
        fullName: user.fullName 
      },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic || "",
        plan: user.plan,
        createdAt: user.createdAt
      },
      message: `Successfully updated plan to ${targetPlan}`
    });
  } catch (error) {
    console.error("Upgrade plan error:", error);
    res.status(500).json({ error: "Failed to upgrade plan." });
  }
});

export default router;
