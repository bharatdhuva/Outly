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
    return true;
  } catch (err) {
    console.error("❌ Serverless MongoDB connection failed:", err);
    return false;
  }
}

export default async function handler(req, res) {
  const connected = await connectDB();
  if (!connected) {
    console.error("Rejecting request because MongoDB connection could not be established.");
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Service unavailable: database connection failed" }));
    return;
  }

  // Vercel rewrites lose the original path. Reconstruct it from the query parameter.
  const url = new URL(req.url, `http://${req.headers.host}`);
  const originalPath = url.searchParams.get("originalPath");
  if (originalPath) {
    // Remove the originalPath param and keep any other query params
    url.searchParams.delete("originalPath");
    const remaining = url.searchParams.toString();
    req.url = originalPath + (remaining ? `?${remaining}` : "");
  }

  return app(req, res);
}
