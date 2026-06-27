import axios from "axios";
import { env } from "../../config/env.js";
import { activityQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";

export async function publishLinkedInPost(text: string): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!env.LINKEDIN_ACCESS_TOKEN || !env.LINKEDIN_PERSON_URN) {
    logger.warn("LinkedIn API credentials missing", { source: "linkedin" });
    return { success: false, error: "Credentials missing" };
  }

  try {
    const urn = env.LINKEDIN_PERSON_URN.startsWith("urn:li:person:")
      ? env.LINKEDIN_PERSON_URN
      : `urn:li:person:${env.LINKEDIN_PERSON_URN}`;

    const payload = {
      author: urn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const response = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      payload,
      {
        headers: {
          Authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    if (response.status === 201) {
      const postId = response.headers["x-restli-id"] || response.data?.id || "unknown";
      
      activityQueries.add(
        "post",
        `Published LinkedIn post (${text.slice(0, 50)}...)`,
        JSON.stringify({ postId })
      );
      
      logger.info(`Successfully posted to LinkedIn (${postId})`, { source: "linkedin" });
      return { success: true, url: `https://www.linkedin.com/feed/update/${postId}` };
    }

    throw new Error(`Unexpected status code: ${response.status}`);
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || String(error);
    activityQueries.add(
      "post",
      "Failed to publish LinkedIn post",
      JSON.stringify({ error: errorMsg })
    );
    logger.error("Failed to publish to LinkedIn", { error: errorMsg, source: "linkedin" });
    return { success: false, error: errorMsg };
  }
}
