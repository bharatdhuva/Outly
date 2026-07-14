import { logger } from "../../lib/logger.js";

export interface GeneratedMail {
  subject: string;
  body: string;
  personalization_hook: string;
  variants?: any;
  followups?: any;
}

export async function generateMailForCompany(
  companyId: string,
  provider: "gemini" | "grok" | "openrouter" = "gemini",
  modelName: string = "gemini-2.5-flash",
): Promise<GeneratedMail | null> {
  logger.info(`Generating mail for company ID: ${companyId}...`);

  try {
    // @ts-ignore
    const privateModule = await import("./mailGenerator.private.js");
    return await privateModule.generateMailForCompany(companyId, provider, modelName);
  } catch (error: any) {
    logger.warn(`Private generator module not found, running sandbox fallback: ${error.message}`);
    return {
      subject: "Accelerating Frontend Performance at Outly",
      body: "Hi Recruiter,\n\nI recently came across Outly and was thoroughly impressed by your modern user-centric platform. I'm a developer specializing in React and TypeScript, and I would love to contribute to your engineering team.\n\nBest regards,\nCandidate",
      personalization_hook: "I noticed Outly's elegant use of Tailwind CSS and layout designs."
    };
  }
}
