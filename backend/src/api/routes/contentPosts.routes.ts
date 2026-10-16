import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";
import { contentPostQueries } from "../../db/queries.js";
import { getEditableSetting } from "../../config/appSettings.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";

const router = Router();

router.use(requireAuth);

// Get all posts for user
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const posts = await contentPostQueries.getAll(req.user.id);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Generate content post using Gemini
router.post("/generate", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const topic = req.body.topic || "Software Engineering";
    const taste = await getEditableSetting(req.user.id, "content_taste");
    const scheduledTime = await getEditableSetting(req.user.id, "content_schedule_time");

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a professional social media manager and content creator.
Generate an engaging post for LinkedIn or Twitter based on the topic: "${topic}".
Incorporate the user's specific preferences: "${taste}".
Make the post high-quality, formatted with spacing, bullet points, and 2-3 relevant hashtags.
Output ONLY the post content. Do not include any meta comments, instructions, or markdown fence blocks.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    if (!responseText) {
      return res.status(500).json({ error: "Failed to generate content." });
    }

    const newPost = await contentPostQueries.insert(req.user.id, {
      content: responseText,
      status: "scheduled",
      scheduledAt: scheduledTime,
    });

    res.json(newPost);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Update post
router.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const updated = await contentPostQueries.update(req.params.id as string, { content: req.body.content }, req.user.id);
    if (!updated) {
      return res.status(404).json({ error: "Post not found." });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Delete post
router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    await contentPostQueries.delete(req.params.id as string, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
