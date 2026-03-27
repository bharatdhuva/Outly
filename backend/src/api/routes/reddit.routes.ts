import { Router } from "express";
import { redditQueries } from "../../db/queries.js";
import { redditQueue } from "../../queue/redditQueue.js";
import { generateRedditPost } from "../../automation/reddit/redditGenerator.js";

const router = Router();

// Get all reddit posts
router.get("/posts", (req, res) => {
  try {
    const posts = redditQueries.getAll();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Create manual reddit post
router.post("/generate", async (req, res) => {
  const { subreddit, topic } = req.body;
  try {
    if (!subreddit) return res.status(400).json({ error: "subreddit is required" });
    
    const postObj = await generateRedditPost(subreddit, topic);
    if (!postObj) return res.status(500).json({ error: "Failed to generate reddit post" });

    const result = redditQueries.insert({
      subreddit,
      title: postObj.title,
      content: postObj.content,
      status: "draft"
    } as Omit<import("../../db/queries.js").RedditPost, "id" | "created_at">);
    
    res.json({ success: true, dbId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Update post status / approve
router.put("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { status, title, content, subreddit } = req.body;
  try {
    redditQueries.update(Number(id), { status, title, content, subreddit } as unknown as Partial<import("../../db/queries.js").RedditPost>);
    if (status === "approved") {
      await redditQueue.add({ dbId: Number(id) });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
