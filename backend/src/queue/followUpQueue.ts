import Queue from "bull";
import { env } from "../config/env.js";

// Queue for sending follow-up emails
export const followUpQueue = new Queue("followUpQueue", env.REDIS_URL);
followUpQueue.on("error", (err) => console.error("Follow-up queue error:", err.message));
