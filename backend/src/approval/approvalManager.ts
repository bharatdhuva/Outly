import { approvalQueries, activityQueries } from "../db/queries.js";
import { sendTelegramMessage } from "../notifications/telegram.js";
import { logger } from "../lib/logger.js";

/**
 * Request approval for a social media post via Telegram.
 * LinkedIn posts get special treatment in v2.3 with manual-post controls.
 */
export async function requestApproval(
  platform: "linkedin" | "twitter" | "reddit",
  postId: number,
  draftContent: string,
) {
  try {
    const info = approvalQueries.insert({
      platform,
      post_id: postId,
      draft_content: draftContent,
      telegram_message_id: null,
      status: "waiting",
      edit_requested_text: null,
      edit_improved_text: null,
    });

    const approvalId = Number(info.lastInsertRowid);

    if (platform === "linkedin") {
      return await sendLinkedInDraftApproval(approvalId, draftContent);
    }

    return await sendStandardApproval(approvalId, platform, draftContent);
  } catch (err) {
    logger.error(`Failed to request approval for ${platform}:`, {
      error: String(err),
      source: "approvalManager",
    });
    return null;
  }
}

function buildPreview(content: string, maxLength = 380): string {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength - 1).trimEnd()}...`;
}

function buildHashtagSummary(content: string): string {
  const hashtags = [...content.matchAll(/#[\p{L}\p{N}_]+/gu)].map((match) => match[0]);
  if (hashtags.length === 0) return "Suggested hashtags: 0";
  return `Suggested hashtags: ${hashtags.length} (${hashtags.slice(0, 6).join(" ")})`;
}

async function sendLinkedInDraftApproval(approvalId: number, draftContent: string) {
  const message = [
    "LinkedIn Post Ready",
    "",
    buildPreview(draftContent),
    "",
    `Chars: ${draftContent.length} / 3000`,
    buildHashtagSummary(draftContent),
  ].join("\n");

  const sentMessage = await sendTelegramMessage(message, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Post Now", callback_data: `approve_${approvalId}` },
          { text: "Skip", callback_data: `skip_${approvalId}` },
        ],
        [
          { text: "Edit", callback_data: `edit_${approvalId}` },
          { text: "Full Preview", callback_data: `preview_${approvalId}` },
        ],
        [{ text: "Copy Full Post", callback_data: `copy_${approvalId}` }],
      ],
    },
  });

  if (sentMessage) {
    approvalQueries.update(approvalId, { telegram_message_id: sentMessage.message_id });
  }
  activityQueries.add("info", "LinkedIn draft sent with Telegram approval controls", { approvalId });
  return approvalId;
}

async function sendStandardApproval(approvalId: number, platform: string, draftContent: string) {
  const label = platform === "twitter" ? "Tweet" : "Reddit Post";
  const message = [
    `${label} Ready`,
    "",
    buildPreview(draftContent),
    "",
    `Chars: ${draftContent.length}`,
  ].join("\n");

  const sentMessage = await sendTelegramMessage(message, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Approve", callback_data: `approve_${approvalId}` },
          { text: "Skip", callback_data: `skip_${approvalId}` },
        ],
        [
          { text: "Edit", callback_data: `edit_${approvalId}` },
          { text: "Full Preview", callback_data: `preview_${approvalId}` },
        ],
      ],
    },
  });

  if (sentMessage) {
    approvalQueries.update(approvalId, { telegram_message_id: sentMessage.message_id });
  }
  activityQueries.add("info", `${platform} draft sent with Telegram approval controls`, { approvalId });
  return approvalId;
}
