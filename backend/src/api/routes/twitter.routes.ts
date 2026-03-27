import { Router } from "express";
import { twitterQueries } from "../../db/queries.js";
import { publishTwitterPost } from "../../automation/twitter/tweetPublisher.js";
import { generateDailyTweet, generateWeeklyThread } from "../../automation/twitter/tweetGenerator.js";

const router = Router();

// Get all twitter posts
router.get("/posts", (req, res) => {
  try {
    const posts = twitterQueries.getAll();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Create manual tweet
router.post("/generate", async (req, res) => {
  const { type, topic } = req.body;
  try {
    let content;
    if (type === "thread") {
      const thread = await generateWeeklyThread(topic);
      if (!thread) return res.status(500).json({ error: "Failed to generate thread" });
      content = JSON.stringify(thread);
    } else {
      const tweet = await generateDailyTweet(topic);
      if (!tweet) return res.status(500).json({ error: "Failed to generate tweet" });
      content = tweet;
    }

    const result = twitterQueries.insert({
      content,
      type: type || "single",
      status: "draft"
    } as Omit<import("../../db/queries.js").TwitterPost, "id" | "created_at">);
    
    res.json({ success: true, dbId: result.lastInsertRowid, content });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Update post status / approve
router.put("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { status, content } = req.body;
  try {
    twitterQueries.update(Number(id), { status, content } as unknown as Partial<import("../../db/queries.js").TwitterPost>);
    if (status === "approved") {
      const posted = await publishTwitterPost(Number(id));
      if (!posted) {
        return res.status(500).json({ error: "Failed to post to Twitter" });
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
