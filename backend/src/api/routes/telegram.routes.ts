import { Router } from "express";
import { approvalQueries, postQueries, twitterQueries, redditQueries, activityQueries } from "../../db/queries.js";
import { tweetQueue } from "../../queue/tweetQueue.js";
import { redditQueue } from "../../queue/redditQueue.js";
import { sendWhatsApp } from "../../notifications/whatsapp.js";
import { editTelegramMessage } from "../../notifications/telegram.js";
import { logger } from "../../lib/logger.js";

const router = Router();

router.get("/approvals", (req, res) => {
  try {
    const pending = approvalQueries.getAllPending();
    res.json(pending);
  } catch (error) {
    logger.error("Failed to fetch approvals:", { error: String(error) });
    res.status(500).json({ error: "Failed to fetch approvals" });
  }
});

router.post("/approvals/:id/action", async (req, res) => {
  const approvalId = parseInt(req.params.id, 10);
  const { action } = req.body;
  
  const approval = approvalQueries.getById(approvalId);
  if (!approval) {
    return res.status(404).json({ error: "Approval not found" });
  }

  try {
    if (action === "approve") {
      const draft = approval.edit_improved_text || approval.draft_content;
      approvalQueries.update(approvalId, { status: 'approved', actioned_at: new Date().toISOString() });
      
      if (approval.platform === 'linkedin') {
        // v2.3: LinkedIn is NEVER auto-posted. Mark as approved for manual copy-paste.
        postQueries.update(approval.post_id, { content: draft, status: 'approved' });
        
        if (approval.telegram_message_id) {
          await editTelegramMessage(
            approval.telegram_message_id, 
            `✅ Approved via Dashboard! Copy and paste on LinkedIn 🚀\n\n${draft.substring(0, 100)}...`
          );
        }
        
        await sendWhatsApp('🔵 LinkedIn post approved! Go paste it on LinkedIn 📱');
        activityQueries.add('success', 'LinkedIn post approved for manual posting via Dashboard');
        
        res.json({ 
          success: true, 
          message: "LinkedIn post approved! Copy the content and paste it on LinkedIn manually.",
          content: draft
        });
        
      } else if (approval.platform === 'twitter') {
        twitterQueries.update(approval.post_id, { content: draft, status: 'approved' });
        await tweetQueue.add({ dbId: approval.post_id });
        
        if (approval.telegram_message_id) {
          await editTelegramMessage(approval.telegram_message_id, `✅ Tweet approved via Dashboard & queued!`);
        }
        activityQueries.add('success', 'Approved Twitter post via Dashboard');
        res.json({ success: true, message: "Tweet approved and queued for auto-posting" });
        
      } else if (approval.platform === 'reddit') {
        redditQueries.update(approval.post_id, { content: draft, status: 'approved' });
        await redditQueue.add({ dbId: approval.post_id });
        
        if (approval.telegram_message_id) {
          await editTelegramMessage(approval.telegram_message_id, `✅ Reddit post approved via Dashboard & queued!`);
        }
        activityQueries.add('success', 'Approved Reddit post via Dashboard');
        res.json({ success: true, message: "Reddit post approved and queued for auto-posting" });
      }

    } else if (action === "skip") {
      approvalQueries.update(approvalId, { status: 'skipped', actioned_at: new Date().toISOString() });
      if (approval.telegram_message_id) {
        await editTelegramMessage(approval.telegram_message_id, `❌ Skipped ${approval.platform} post (Dashboard).`);
      }
      activityQueries.add('info', `Skipped ${approval.platform} post via Dashboard`);
      res.json({ success: true, message: "Skipped successfully" });
    } else {
      res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    logger.error("Failed to action approval:", { error: String(error) });
    res.status(500).json({ error: "Failed to perform action" });
  }
});

export default router;
