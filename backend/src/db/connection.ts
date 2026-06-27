import mongoose from "mongoose";
import { env } from "../config/env.js";

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  const uri = process.env.MONGODB_URI || env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing from environment variables.");
    return false;
  }

  try {
    const connectOptions = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };
    await mongoose.connect(uri, connectOptions);

    mongoose.connection.on("error", (err) => {
      console.error("Mongoose connection error:", err?.message || err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("Mongoose disconnected");
      isConnected = false;
    });

    isConnected = true;
    console.log("✅ MongoDB connected successfully", {
      readyState: mongoose.connection.readyState,
    });
    return true;
  } catch (err: any) {
    console.error("❌ MongoDB connection failed:", err?.message || err);
    isConnected = false;
    return false;
  }
}
