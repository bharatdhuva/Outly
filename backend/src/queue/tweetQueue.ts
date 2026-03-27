import Queue from "bull";
import { env } from "../config/env.js";

// Queue for publishing Twitter posts
export const tweetQueue = new Queue("tweetQueue", env.REDIS_URL);
tweetQueue.on("error", (err) => console.error("Tweet queue error:", err.message));
