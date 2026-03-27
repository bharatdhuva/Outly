import { config } from "dotenv";
config({ path: ".env" });
import { google } from "googleapis";
import http from "http";
import fs from "fs";
import path from "path";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
];

async function main() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env");
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "http://localhost:3001/auth/gmail/callback"
  );
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  const server = http.createServer(async (req, res) => {
    if (!req.url?.startsWith("/auth/gmail/callback")) return;
    const url = new URL(req.url, "http://localhost");
    const code = url.searchParams.get("code");
    res.end("Auth complete! You can close this tab.");
    server.close();

    if (!code) {
      console.error("No code received");
      process.exit(1);
    }
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      console.error("No refresh token - try revoking access and trying again");
      process.exit(1);
    }

    const envPath = path.join(process.cwd(), ".env");
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
    if (envContent.includes("GMAIL_REFRESH_TOKEN=")) {
      envContent = envContent.replace(/GMAIL_REFRESH_TOKEN=.*/, `GMAIL_REFRESH_TOKEN=${refreshToken}`);
    } else {
      envContent += `\nGMAIL_REFRESH_TOKEN=${refreshToken}`;
    }
    fs.writeFileSync(envPath, envContent.trim() + "\n");
    console.log("✅ Gmail refresh token saved to .env");
    process.exit(0);
  });

  server.listen(3001, () => {
    console.log("\nOpen this URL in your browser to authorize Gmail:\n", authUrl, "\n");
    try {
      require("child_process").exec(process.platform === "win32" ? `start "" "${authUrl}"` : `open "${authUrl}"`);
    } catch {
      // Ignore if open fails
    }
  });
}

main();
