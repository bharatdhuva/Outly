import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

const isConfigured = !!(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  console.log("☁️ Cloudinary successfully configured.");
} else {
  console.warn("⚠️ Cloudinary credentials missing in .env. Falling back to local disk storage.");
}

/**
 * Uploads a file to Cloudinary
 * @param filePath The local path of the file to upload
 * @param folder The folder in Cloudinary to upload to
 * @returns The secure URL of the uploaded file, or null if Cloudinary is not configured or fails
 */
import path from "path";

export async function uploadToCloudinary(filePath: string, folder = "resumes"): Promise<string | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const isDocument = [".pdf", ".docx", ".doc", ".txt", ".rtf"].includes(ext);
    const resource_type = isDocument ? "raw" : "auto";

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type,
      access_mode: "public",
    });
    return result.secure_url;
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error);
    return null;
  }
}
