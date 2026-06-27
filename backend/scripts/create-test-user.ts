import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });

import { User } from "../src/db/models.js";
import { env } from "../src/config/env.js";

async function createTestUser() {
  console.log("Connecting to MongoDB at", env.MONGODB_URI);
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const email = "test@example.com";
    const password = "password123";
    const fullName = "Test User";

    let user = await User.findOne({ email });
    const passwordHash = await bcrypt.hash(password, 10);

    if (user) {
      console.log(`User ${email} already exists. Updating credentials and plan...`);
      user.passwordHash = passwordHash;
      user.fullName = fullName;
      user.plan = "pro";
      await user.save();
    } else {
      user = new User({
        email,
        passwordHash,
        fullName,
        plan: "pro"
      });
      await user.save();
      console.log(`✅ Created test user successfully.`);
    }

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

    console.log("\n------------------------------------------------");
    console.log("🔑 TEST USER CREATED / UPDATED DETAILS:");
    console.log("------------------------------------------------");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Full Name:${fullName}`);
    console.log(`Plan:     ${user.plan}`);
    console.log(`User ID:  ${user._id}`);
    console.log(`JWT Token:\n${token}`);
    console.log("------------------------------------------------\n");

  } catch (error) {
    console.error("❌ Error creating test user:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestUser();
