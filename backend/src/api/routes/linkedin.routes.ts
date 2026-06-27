import { Router, Response } from "express";
import { postQueries, settingsQueries } from "../../db/queries.js";
import { fetchAllNews } from "../../automation/news/fetcher.js";
import { generateLinkedInDraft, generateWeeklyLinkedInPost } from "../../automation/news/contentGenerator.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";

const router = Router();

// Protect all routes
router.use(requireAuth);

router.get("/posts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const posts = await postQueries.getAll(req.user.id);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * v2.3: Generate a fresh daily LinkedIn draft
 * Returns the draft content
 */
router.post("/generate-draft", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const news = await fetchAllNews();
    const voiceProfile = await settingsQueries.get(req.user.id, "linkedin_voice_profile");
    const voiceEnabled = (await settingsQueries.get(req.user.id, "linkedin_voice_enabled")) === "true";
    
    const content = await generateLinkedInDraft(news, voiceProfile, voiceEnabled);
    const post = await postQueries.insert(req.user.id, {
      content,
      news_sources: JSON.stringify(news.map((n) => ({ title: n.title, url: n.url, source: n.source }))),
      status: "draft",
      posted_at: null,
      linkedin_post_url: null,
    });
    
    res.json({ 
      id: post.id, 
      content, 
      charCount: content.length,
      newsSources: news.map((n) => ({ title: n.title, url: n.url, source: n.source })) 
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * Generate weekly tech roundup (Monday style)
 */
router.post("/generate-weekly-post", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const news = await fetchAllNews();
    const voiceProfile = await settingsQueries.get(req.user.id, "linkedin_voice_profile");
    const voiceEnabled = (await settingsQueries.get(req.user.id, "linkedin_voice_enabled")) === "true";
    
    const content = await generateWeeklyLinkedInPost(news, voiceProfile, voiceEnabled);
    const post = await postQueries.insert(req.user.id, {
      content,
      news_sources: JSON.stringify(news.map((n) => ({ title: n.title, url: n.url, source: n.source }))),
      status: "draft",
      posted_at: null,
      linkedin_post_url: null,
    });
    
    res.json({ 
      id: post.id, 
      content, 
      charCount: content.length,
      newsSources: news.map((n) => ({ title: n.title, url: n.url, source: n.source })) 
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * Legacy endpoint for backward compat
 */
router.post("/generate-post", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const news = await fetchAllNews();
    const voiceProfile = await settingsQueries.get(req.user.id, "linkedin_voice_profile");
    const voiceEnabled = (await settingsQueries.get(req.user.id, "linkedin_voice_enabled")) === "true";
    
    const content = await generateLinkedInDraft(news, voiceProfile, voiceEnabled);
    const post = await postQueries.insert(req.user.id, {
      content,
      news_sources: JSON.stringify(news.map((n) => ({ title: n.title, url: n.url }))),
      status: "draft",
      posted_at: null,
      linkedin_post_url: null,
    });
    
    res.json({ id: post.id, content, newsSources: news.map((n) => ({ title: n.title, url: n.url, source: n.source })) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.patch("/posts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;
    const { content, status } = req.body;

    const post = await postQueries.getById(id, req.user.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (content !== undefined) {
      await postQueries.update(id, { content }, req.user.id);
    }
    if (status) {
      await postQueries.updateStatus(id, status, {}, req.user.id);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * v2.3: Mark LinkedIn post as manually posted
 */
router.post("/mark-posted/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;

    const post = await postQueries.getById(id, req.user.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    
    await postQueries.updateStatus(id, "posted", {
      posted_at: new Date()
    }, req.user.id);
    
    res.json({ ok: true, message: "Post marked as manually posted on LinkedIn" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * Legacy publish endpoint — kept for backward compat but now just marks as posted
 */
router.post("/publish-post/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;

    const post = await postQueries.getById(id, req.user.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    
    await postQueries.updateStatus(id, "posted", {
      posted_at: new Date()
    }, req.user.id);
    
    res.json({ 
      ok: true, 
      message: "Post marked as posted. Copy the content and paste it on LinkedIn manually for safety." 
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.patch("/settings/weekly-post", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const enabled = req.body.enabled !== false;
    await settingsQueries.set(req.user.id, "weekly_post_enabled", String(enabled));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete("/posts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;

    const post = await postQueries.getById(id, req.user.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    await postQueries.delete(id, req.user.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
