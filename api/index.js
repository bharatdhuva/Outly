import mongoose from "mongoose";
import app from "../backend/dist/src/api/server.js";
import { env } from "../backend/dist/src/config/env.js";

let isConnected = false;

async function connectDB() {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  const uri = process.env.MONGODB_URI || env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing from environment variables.");
    return;
  }
  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("✅ Serverless function connected to MongoDB successfully");
  } catch (err) {
    console.error("❌ Serverless MongoDB connection failed:", err);
  }
}

export default async function handler(req, res) {
  await connectDB();

  if (req.headers["x-forwarded-uri"]) {
    req.url = req.headers["x-forwarded-uri"];
  }

  return app(req, res);
}
