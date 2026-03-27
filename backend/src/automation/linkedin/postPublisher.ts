import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

export async function publishLinkedInPost(content: string): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!env.LINKEDIN_ACCESS_TOKEN || !env.LINKEDIN_PERSON_URN) {
    return { success: false, error: "LinkedIn API not configured" };
  }

  try {
    const res = await axios.post(
      "https://api.linkedin.com/rest/posts",
      {
        author: env.LINKEDIN_PERSON_URN,
        commentary: content,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      },
      {
        headers: {
          Authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "LinkedIn-Version": "202401",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    const postUrl = res.data?.id ? `https://linkedin.com/feed/update/${res.data.id}` : undefined;
    logger.info("LinkedIn post published", { source: "linkedin" });
    return { success: true, url: postUrl };
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logger.error("LinkedIn post failed", { error: errMsg, source: "linkedin" });
    return { success: false, error: errMsg };
  }
}
