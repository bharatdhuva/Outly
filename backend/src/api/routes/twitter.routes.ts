import { Router, Response } from "express";
import { twitterQueries, settingsQueries } from "../../db/queries.js";
import { publishTwitterPost } from "../../automation/twitter/tweetPublisher.js";
import { generateDailyTweet, generateWeeklyThread } from "../../automation/twitter/tweetGenerator.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";

const router = Router();

// Protect all routes
router.use(requireAuth);

// Get all twitter posts for the user
router.get("/posts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const posts = await twitterQueries.getAll(req.user.id);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Create manual tweet
router.post("/generate", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { type, topic } = req.body;

    let content;
    const voiceProfile = await settingsQueries.get(req.user.id, "twitter_voice_profile");
    const voiceEnabled = (await settingsQueries.get(req.user.id, "twitter_voice_enabled")) === "true";

    if (type === "thread") {
      const thread = await generateWeeklyThread(topic, voiceProfile, voiceEnabled);
      if (!thread) return res.status(500).json({ error: "Failed to generate thread" });
      content = JSON.stringify(thread);
    } else {
      const tweet = await generateDailyTweet(topic, voiceProfile, voiceEnabled);
      if (!tweet) return res.status(500).json({ error: "Failed to generate tweet" });
      content = tweet;
    }

    const result = await twitterQueries.insert(req.user.id, {
      content,
      type: type || "single",
      status: "draft",
      posted_at: null,
      twitter_post_id: null,
      impressions: 0,
      likes: 0,
      replies: 0,
      error_message: null
    });
    
    res.json({ success: true, dbId: result.id, content });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Update post status / approve
router.put("/posts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;
    const { status, content } = req.body;

    const post = await twitterQueries.getById(id, req.user.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    await twitterQueries.update(id, { status, content }, req.user.id);

    if (status === "approved") {
      const posted = await publishTwitterPost(id as any); // id is a string
      if (!posted) {
        return res.status(500).json({ error: "Failed to post to Twitter" });
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.delete("/posts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;

    const post = await twitterQueries.getById(id, req.user.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    await twitterQueries.delete(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
