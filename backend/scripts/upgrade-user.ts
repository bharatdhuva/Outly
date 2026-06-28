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
  const localUri = "mongodb://localhost:27017/outly";
  const atlasUri = "mongodb+srv://developerbharat05_db_user:Outly2026Bharat@outly-databasse.vghqsbl.mongodb.net/outly?retryWrites=true&w=majority&appName=Outly-databasse";
  
  await upgradeOnUri(localUri, "Local MongoDB");
  await upgradeOnUri(atlasUri, "Atlas MongoDB");
  process.exit(0);
}

run();
