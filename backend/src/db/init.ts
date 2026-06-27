import mongoose from "mongoose";
import { env } from "../config/env.js";

async function init() {
  console.log("Connecting to MongoDB at", env.MONGODB_URI);
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Successfully connected to MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

init();
