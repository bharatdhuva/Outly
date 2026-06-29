import { User } from "../src/db/models.js";
import { env } from "../src/config/env.js";
import mongoose from "mongoose";

async function upgradeOnUri(uri: string, name: string) {
  const targetEmail = "bharatdhuva1750@gmail.com";
  console.log(`Connecting to ${name} (${uri})...`);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
    });
    console.log(`✅ Connected to ${name}`);

    let user = await User.findOne({ email: targetEmail.toLowerCase().trim() });
    if (!user) {
      user = await User.findOne({ email: new RegExp(`^${targetEmail}$`, "i") });
    }

    if (user) {
      user.plan = "pro";
      user.planExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await user.save();
      console.log(`🎉 [${name}] Successfully upgraded user ${user.email} to PRO plan!`);
    } else {
      console.log(`⚠️ [${name}] User ${targetEmail} not found.`);
    }
  } catch (error) {
    console.error(`❌ [${name}] Error:`, error);
  } finally {
    await mongoose.disconnect();
  }
}

async function run() {
  const mongoUri = process.env.MONGODB_URI || env.MONGODB_URI || "mongodb://localhost:27017/outly";
  
  await upgradeOnUri(mongoUri, "Target MongoDB");
  process.exit(0);
}

run();
