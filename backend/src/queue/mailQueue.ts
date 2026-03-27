import Bull from "bull";
import { env } from "../config/env.js";

export const mailQueue = new Bull("mail", env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 60000 },
    removeOnComplete: 100,
  },
});

mailQueue.on("error", (err) => {
  console.error("Mail queue error:", err.message);
});

