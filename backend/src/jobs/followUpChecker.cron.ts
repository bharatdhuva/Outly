import cron from "node-cron";
import { env } from "../config/env.js";
import { companyQueries } from "../db/queries.js";
import { User as UserModel } from "../db/models.js";
import { logger } from "../lib/logger.js";
import { followUpQueue } from "../queue/followUpQueue.js";
import { generateFollowUp } from "../automation/coldmail/followUpEngine.js";

export function scheduleFollowUpChecker() {
  if (env.FOLLOWUP_ENABLED === "false") {
    logger.info("Follow-up engine is disabled in config.", { source: "outly" });
    return;
  }

  // Runs on the defined FOLLOWUP_CHECK_CRON schedule, e.g., 0 */6 * * * (Every 6 hours)
  cron.schedule(env.FOLLOWUP_CHECK_CRON || "0 */6 * * *", async () => {
    try {
      const users = await UserModel.find();
      if (users.length === 0) return;

      logger.info(`Running FollowUp Checker Cron Job for ${users.length} users...`, { source: "outly" });

      const delayDays = parseInt(env.FOLLOWUP_DELAY_DAYS || "5", 10);

      for (const user of users) {
        const userId = user._id.toString();
        
        try {
          // Find companies that were mailed > FOLLOWUP_DELAY_DAYS ago and haven't replied
          const dueCompanies = await companyQueries.getDueForFollowUp(delayDays, userId);

          if (dueCompanies.length === 0) {
            continue;
          }

          logger.info(`Found ${dueCompanies.length} companies due for follow-up for user ${userId}. Generating emails...`, { source: "outly", userId });

          for (const company of dueCompanies) {
            if (!company.generated_subject) continue;

            try {
              const followUp = await generateFollowUp(company.company_name, company.role, company.generated_subject);
              if (followUp && followUp.body && followUp.subject) {
                await followUpQueue.add({
                  companyId: company.id,
                  subject: followUp.subject,
                  body: followUp.body
                });
                logger.info(`Queued follow-up for ${company.company_name}`, { source: "outly", userId });
                
                // Preemptively mark as 'queued' equivalent by setting generating so it's not picked up twice
                await companyQueries.update(company.id, {
                  followup_status: "pending"
                }, userId);
              }
            } catch (err) {
              logger.error(`Failed to generate follow up for ${company.company_name}`, { error: String(err), source: "outly", userId });
            }
          }
        } catch (err) {
          logger.error("Failed to run follow-up checker for user", { error: String(err), userId, source: "outly" });
        }
      }
    } catch (e) {
      logger.error("Follow-up checker cron fatal error", { error: String(e), source: "outly" });
    }
  });

  logger.info(`FollowUp Checker scheduled: ${env.FOLLOWUP_CHECK_CRON || "0 */6 * * *"}`, { source: "outly" });
}
