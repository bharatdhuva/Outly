import { logger } from "../../lib/logger.js";

export interface FollowUpResponse {
  subject: string;
  body: string;
  new_angle: string;
}

export async function generateFollowUp(companyName: string, role: string, originalSubject: string): Promise<FollowUpResponse | null> {
  logger.info(`Generating follow up draft for ${companyName} (${role})...`);

  try {
    // @ts-ignore
    const privateModule = await import("./followUpEngine.private.js");
    return await privateModule.generateFollowUp(companyName, role, originalSubject);
  } catch (error: any) {
    logger.warn(`Private followUp module not found, running sandbox fallback: ${error.message}`);
    return {
      subject: `Re: ${originalSubject}`,
      body: `Hi there,\n\nI'm following up on my previous message regarding the ${role} position at ${companyName}. I'd love to schedule a brief call to discuss how my skill set matches your team's current needs.\n\nThanks,\nCandidate`,
      new_angle: "Soft follow-up reinforcing technical alignment."
    };
  }
}
