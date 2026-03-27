import Queue from "bull";
import { env } from "../config/env.js";

// Queue for publishing Reddit posts
export const redditQueue = new Queue("redditQueue", env.REDIS_URL);
redditQueue.on("error", (err) => console.error("Reddit queue error:", err.message));
