import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

async function main() {
    if (!uri) {
        console.error("❌ MONGODB_URI is not defined in the environment!");
        process.exit(1);
    }
    
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
        });
        console.log("✅ Connected successfully using mongoose!");
    } catch (err) {
        console.error("❌ Connection failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

main();