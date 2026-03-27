import { config } from "dotenv";
config();
import { companyQueries, jobQueries, postQueries } from "./src/db/queries.js";
import { sendWhatsApp } from "./src/notifications/whatsapp.js";

async function run() {
  console.log("Generating Daily Summary...");
  
  const mailsSent = companyQueries.countMailSent();
  const mailsToday = companyQueries.countMailsSentToday();
  const replies = companyQueries.countReplies();
  const appliedToday = jobQueries.countAppliedToday();
  
  // Safe default since posts might not exist yet
  const postsList = postQueries.getAll();
  const latestPost = postsList.length > 0 ? postsList[0] : null;
  const postStatus = latestPost?.status === "posted" ? "✅ Published" : "❌ Not published";

  const msg = `📧 *Outly Daily Report (Dry Run)*\n\nMails sent today: ${mailsToday}\nTotal mails sent: ${mailsSent}\nReplies received: ${replies}\nJobs applied today: ${appliedToday}\nLinkedIn post: ${postStatus}`;

  console.log("\nSending the following message to WhatsApp:");
  console.log("------------------------------------------");
  console.log(msg);
  console.log("------------------------------------------");

  await sendWhatsApp(msg);
  console.log("\n✅ Sent! Check your WhatsApp.");
}

run();
