import { postQueries } from "../src/db/queries.js";
import { requestApproval } from "../src/approval/approvalManager.js";

async function sendTestPost() {
  const content = `🔥 WebSockets sound cool, but HTTP polling works for 90% of apps.

I over-engineered a tracking feature today for JobOS. Sometimes the most scalable stack is the boring one. ⚙️

Curious if anyone else feels the same way?

#WebSockets #SystemDesign #dailytech #buildinpublic`;

  console.log("Saving to DB and requesting approval layout...");
  const post = postQueries.insert({ 
    content: content, 
    news_sources: "[]", 
    status: 'draft', 
    posted_at: null, 
    linkedin_post_url: null 
  });
  
  await requestApproval('linkedin', Number((post as any).lastInsertRowid), content);
  console.log("Sent successfully! Check your Telegram.");
}

sendTestPost().catch(console.error).finally(() => process.exit(0));
