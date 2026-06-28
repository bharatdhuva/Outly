import { Router, Response } from "express";
import axios from "axios";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { google } from "googleapis";
import { User } from "../../db/models.js";
import { env } from "../../config/env.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";
import { connectDB } from "../../db/connection.js";
import { sendWelcomeMail } from "../../automation/coldmail/mailSender.js";

const router = Router();

// 1. SIGNUP
router.post("/signup", async (req, res) => {
  try {
    await connectDB();
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
        plan: user.plan,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    // Log full stack for diagnostics in production logs
    console.error("Signup error:", error instanceof Error ? error.stack || error.message : error);

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
    await connectDB();
    const { access_token: accessToken, credential } = req.body;
    const googleToken = accessToken ?? credential;

    if (!googleToken) {
      return res.status(400).json({ error: "Missing Google credential." });
    }

    let payload: { email?: string; email_verified?: string; aud?: string; name?: string; picture?: string } | null = null;

    if (accessToken) {
      const userInfoResponse = await axios.get("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      payload = userInfoResponse.data;
    } else {
      const verificationUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(googleToken)}`;
      const tokenInfoResponse = await axios.get(verificationUrl);
      payload = tokenInfoResponse.data;
    }

    if (!payload?.email) {
      return res.status(400).json({ error: "Invalid Google credential." });
    }

    const emailNormalized = payload.email.toLowerCase();
    let user = await User.findOne({ email: emailNormalized });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), saltRounds);

      user = new User({
        email: emailNormalized,
        passwordHash,
        fullName: payload.name || "",
        profilePic: payload.picture || "",
        plan: "free"
      });

      await user.save();

      // Trigger Welcome Email for new Google account creation
      sendWelcomeMail(user.email, user.fullName || undefined).catch((err) =>
        console.error("Google welcome email trigger error:", err)
      );
    } else if (payload.picture && user.profilePic !== payload.picture) {
      user.profilePic = payload.picture;
      await user.save();
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
    console.error("Google login error:", error);
    res.status(500).json({ error: "Failed to log in with Google." });
  }
});

router.post("/login", async (req, res) => {
  try {
    await connectDB();
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
        plan: user.plan,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to log in." });
  }
});

// 3. GET CURRENT USER PROFILE
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB();
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
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to retrieve user session." });
  }
});

// 4. MOCK UPGRADE ROUTE FOR TESTING
router.get("/gmail/url", (req, res) => {
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
    await connectDB();
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { plan } = req.body;
    const targetPlan = plan === "pro" ? "pro" : "free";

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          plan: targetPlan,
          planExpiresAt: targetPlan === "pro" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
        } 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
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
