import { logger } from "../../lib/logger.js";
import { companyQueries } from "../../db/queries.js";

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
    const result = await privateModule.generateMailForCompany(companyId, provider, modelName);
    if (result && result.subject && result.body) {
      return result;
    }
  } catch (error: any) {
    logger.warn(`Private generator module execution note: ${error?.message || error}`);
  }

  // Fallback dynamic generator using company record from MongoDB
  try {
    const company = await companyQueries.getById(companyId);
    if (!company) {
      logger.error(`Company with ID ${companyId} not found during mail generation`);
      return null;
    }

    const recipientName = company.target_person_name || "Hiring Team";
    const companyName = company.company_name || "your team";
    const role = company.role || "Software Engineer";
    const skills = company.key_skills || "React, Node.js, Express, MongoDB";
    const sender = company.sender_name || "Bharat Dhuva";
    const hook = company.personalization_hook || `I've been closely following ${companyName}'s work and tech initiatives.`;

    const subject = `Application for ${role} - ${sender}`;
    const body = `Hi ${recipientName},\n\n${hook}\n\nI am writing to express my strong interest in the ${role} position at ${companyName}. With hands-on experience in ${skills}, I specialize in building scalable web applications and delivering clean, efficient software.\n\nI would love the opportunity to discuss how my background aligns with your engineering goals. Please let me know if you are open to a quick chat this week.\n\nBest regards,\n${sender}`;
    const personalization_hook = hook;

    // Save generated mail to database
    await companyQueries.update(companyId, {
      generated_subject: subject,
      generated_mail: body,
      personalization_hook,
      status: "mail_generated"
    });

    return {
      subject,
      body,
      personalization_hook
    };
  } catch (err: any) {
    logger.error(`Dynamic mail generator fallback failed: ${err?.message || err}`);
    return null;
  }
}
