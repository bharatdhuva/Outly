import app from "../backend/dist/src/api/server.js";
import { connectDB } from "../backend/dist/src/db/connection.js";

export default async function handler(req, res) {
  const connected = await connectDB();
  if (!connected) {
    console.error("Rejecting request because MongoDB connection could not be established.");
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Service unavailable: database connection failed" }));
    return;
  }

  // Ensure VERCEL_URL is set from host header for internal co-hosted microservice calls
  if (req.headers.host && !process.env.VERCEL_URL) {
    process.env.VERCEL_URL = req.headers.host;
  }

  // Vercel rewrites lose the original path. Reconstruct it from the query parameter.
  const url = new URL(req.url, `http://${req.headers.host}`);
  const originalPath = url.searchParams.get("originalPath");
  if (originalPath) {
    // Remove the originalPath param and keep any other query params
    url.searchParams.delete("originalPath");
    const remaining = url.searchParams.toString();
    req.url = originalPath + (remaining ? `?${remaining}` : "");
  }

  return app(req, res);
}
