import { Router } from "express";
import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import {
  postQueries,
  settingsQueries,
} from "../../db/queries.js";
import { fetchAllNews } from "../../automation/news/fetcher.js";
import { generateLinkedInDraft, generateWeeklyLinkedInPost } from "../../automation/news/contentGenerator.js";
import { requestApproval } from "../../approval/approvalManager.js";
import { env } from "../../config/env.js";

const router = Router();


// LINKEDIN POSTS (v2.3 — Manual Posting Flow)
// ═══════════════════════════════════════════════

router.get("/posts", (_req, res) => {
  const posts = postQueries.getAll();
  res.json(posts);
});

/**
 * v2.3: Generate a fresh daily LinkedIn draft
 * Returns the draft content and sends Telegram approval with Copy button
 */
router.post("/generate-draft", async (_req, res) => {
  try {
    const news = await fetchAllNews();
    const content = await generateLinkedInDraft(news);
    const post = postQueries.insert({
      content,
      news_sources: JSON.stringify(news.map((n) => ({ title: n.title, url: n.url, source: n.source }))),
      status: "draft",
      posted_at: null,
      linkedin_post_url: null,
    });
    const id = Number((post as any).lastInsertRowid);
    
    // Send Telegram approval with Copy button
    await requestApproval('linkedin', id, content);
    
    res.json({ 
      id, 
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
router.post("/generate-weekly-post", async (_req, res) => {
  try {
    const news = await fetchAllNews();
    const content = await generateWeeklyLinkedInPost(news);
    const post = postQueries.insert({
      content,
      news_sources: JSON.stringify(news.map((n) => ({ title: n.title, url: n.url, source: n.source }))),
      status: "draft",
      posted_at: null,
      linkedin_post_url: null,
    });
    const id = Number((post as any).lastInsertRowid);
    
    await requestApproval('linkedin', id, content);
    
    res.json({ 
      id, 
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
router.post("/generate-post", async (_req, res) => {
  try {
    const news = await fetchAllNews();
    const content = await generateLinkedInDraft(news);
    const post = postQueries.insert({
      content,
      news_sources: JSON.stringify(news.map((n) => ({ title: n.title, url: n.url }))),
      status: "draft",
      posted_at: null,
      linkedin_post_url: null,
    });
    const id = Number((post as any).lastInsertRowid);
    res.json({ id, content, newsSources: news.map((n) => ({ title: n.title, url: n.url, source: n.source })) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.patch("/posts/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  const { content, status } = req.body;
  const post = postQueries.getById(id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (content !== undefined) {
    postQueries.update(id, { content });
  }
  if (status) {
    postQueries.updateStatus(id, status);
  }
  res.json({ ok: true });
});

/**
 * v2.3: Mark LinkedIn post as manually posted
 * (Replaces the old auto-publish endpoint)
 */
router.post("/mark-posted/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  const post = postQueries.getById(id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  
  postQueries.updateStatus(id, "posted", {
    posted_at: new Date().toISOString(),
  });
  
  res.json({ ok: true, message: "Post marked as manually posted on LinkedIn" });
});

/**
 * Legacy publish endpoint — kept for backward compat but now just marks as posted
 * v2.3: LinkedIn posts should be manually posted, NOT auto-published via API
 */
router.post("/publish-post/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  const post = postQueries.getById(id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  
  // v2.3 SAFETY: Just mark as posted instead of auto-publishing
  postQueries.updateStatus(id, "posted", {
    posted_at: new Date().toISOString(),
  });
  
  res.json({ 
    ok: true, 
    message: "Post marked as posted. Copy the content and paste it on LinkedIn manually for safety." 
  });
});

router.patch("/settings/weekly-post", (req, res) => {
  const enabled = req.body.enabled !== false;
  settingsQueries.set("weekly_post_enabled", String(enabled));
  res.json({ ok: true });
});

export default router;
