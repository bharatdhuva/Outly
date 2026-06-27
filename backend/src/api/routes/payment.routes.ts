import { Router, Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { User } from "../../db/models.js";
import { connectDB } from "../../db/connection.js";

const router = Router();

function getRazorpayInstance() {
  const key_id = (process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || "").trim();
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET || "").trim();

  console.log(`[Razorpay] Credentials check -> Key ID: ${key_id ? key_id.substring(0, 8) + "..." : "MISSING"}, Secret: ${key_secret ? key_secret.substring(0, 8) + "..." : "MISSING"}`);

  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing in environment variables.");
  }
  return new Razorpay({
    key_id,
    key_secret,
  });
}

// STEP 1: CREATE ORDER
// Endpoint: POST /api/create-order (and /create-order)
router.post("/create-order", async (req: Request, res: Response) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    // Validate amount
    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 100) {
      return res.status(400).json({ error: "Amount is required and must be at least 100 paise (₹1)." });
    }

    let razorpay;
    try {
      razorpay = getRazorpayInstance();
    } catch (err: any) {
      return res.status(401).json({ error: err.message || "Authentication failed. Invalid or missing Razorpay credentials." });
    }

    const options = {
      amount: Math.round(parsedAmount),
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({ error: error?.error?.description || error?.message || "Failed to create Razorpay order." });
  }
});

// STEP 3: VERIFY SIGNATURE
// Endpoint: POST /api/verify-payment (and /verify-payment)
router.post("/verify-payment", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required verification parameters (razorpay_payment_id, razorpay_order_id, razorpay_signature)." });
    }

    const key_secret = (process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET || "").trim();
    if (!key_secret) {
      return res.status(500).json({ error: "Razorpay secret is not configured on server." });
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const generatedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Signature mismatch. Payment verification failed." });
    }

    // Optional: Upgrade user in DB if auth token is present in header
    let updatedUserToken: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        if (decoded?.id) {
          const updatedUser = await User.findByIdAndUpdate(
            decoded.id,
            {
              $set: {
                plan: "pro",
                planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            },
            { new: true }
          );
          if (updatedUser) {
            updatedUserToken = jwt.sign(
              {
                id: updatedUser._id.toString(),
                email: updatedUser.email,
                plan: updatedUser.plan,
                fullName: updatedUser.fullName
              },
              env.JWT_SECRET,
              { expiresIn: "7d" }
            );
          }
        }
      } catch (e) {
        // Token verification failed or user update error, but signature check passed
        console.warn("User upgrade during payment verification warning:", e);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      token: updatedUserToken
    });
  } catch (error: any) {
    console.error("Razorpay signature verification error:", error);
    return res.status(500).json({ error: "Server error during payment verification." });
  }
});

export default router;
