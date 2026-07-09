import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";

const uploadDir = path.join(env.DATA_DIR, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Strictly limit resume files to .pdf, .docx, .txt and max size 5MB
export const uploadResume = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1, // Only 1 file per request
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = [".pdf", ".docx", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Check extension
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Unsupported file type. Please upload a .txt, .pdf, or .docx file."));
    }

    // Check mime type to prevent double extension spoofing (e.g. resume.exe.pdf)
    const allowedMimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("File content does not match allowed types."));
    }

    cb(null, true);
  }
});

// Strictly limit lead imports to .csv and max size 10MB
export const uploadCSV = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (ext !== ".csv") {
      return cb(new Error("Unsupported file type. Please upload a valid .csv file."));
    }

    const allowedMimeTypes = ["text/csv", "application/vnd.ms-excel", "application/octet-stream"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("File content does not match allowed CSV type."));
    }

    cb(null, true);
  }
});
