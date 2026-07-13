import mongoose from "mongoose";
import { env } from "../config/env.js";

let isConnected = false;
let dbConnectionPromise: Promise<boolean> | null = null;

export async function connectDB(): Promise<boolean> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  if (dbConnectionPromise) {
    return dbConnectionPromise;
  }

  const uri = process.env.MONGODB_URI || env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing from environment variables.");
    return false;
  }

  dbConnectionPromise = (async () => {
    try {
      const connectOptions = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: true,
      };
      await mongoose.connect(uri, connectOptions);

      if (mongoose.connection.listeners("error").length === 0) {
        mongoose.connection.on("error", (err) => {
          console.error("Mongoose connection error:", err?.message || err);
        });
      }

      if (mongoose.connection.listeners("disconnected").length === 0) {
        mongoose.connection.on("disconnected", () => {
          console.warn("Mongoose disconnected");
          isConnected = false;
          dbConnectionPromise = null;
        });
      }

      isConnected = true;
      console.log("✅ MongoDB connected successfully", {
        readyState: mongoose.connection.readyState,
      });
      return true;
    } catch (err: any) {
      console.error("❌ MongoDB connection failed:", err?.message || err);
      isConnected = false;
      dbConnectionPromise = null;
      return false;
    }
  })();

  return dbConnectionPromise;
}
