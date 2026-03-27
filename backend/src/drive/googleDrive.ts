import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import { getResumeDriveFileId } from "../config/appSettings.js";

export async function downloadResumeToTemp(): Promise<string | null> {
  const resumeDriveFileId = getResumeDriveFileId();
  if (!resumeDriveFileId || !env.GOOGLE_DRIVE_REFRESH_TOKEN) return null;

  const oauth2Client = new google.auth.OAuth2(
    env.GMAIL_CLIENT_ID,
    env.GMAIL_CLIENT_SECRET,
    env.GMAIL_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: env.GOOGLE_DRIVE_REFRESH_TOKEN });
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const tmpDir = path.join(env.DATA_DIR, "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const destPath = path.join(tmpDir, "resume.pdf");

  const res = await drive.files.get(
    { fileId: resumeDriveFileId, alt: "media" },
    { responseType: "stream" }
  );

  const dest = fs.createWriteStream(destPath);
  await new Promise<void>((resolve, reject) => {
    (res.data as NodeJS.ReadableStream).pipe(dest);
    dest.on("finish", resolve);
    dest.on("error", reject);
  });

  return destPath;
}

export function isDriveConfigured(): boolean {
  return !!(getResumeDriveFileId() && env.GOOGLE_DRIVE_REFRESH_TOKEN);
}
