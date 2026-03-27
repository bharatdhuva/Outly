import 'dotenv/config';
import { requestApproval } from '../src/approval/approvalManager.js';
import { getDb } from '../src/db/queries.js';

async function testTelegram() {
  console.log('🤖 Sending Test Approval to Telegram...');

  const dummyDraft = `🚀 Just shipped an amazing new feature! Loving the developer experience with Node.js and React. Highly recommend building side projects to learn new stacks. #SDE #BuildInPublic`;
  
  // Create a fake post in the DB
  const insertStmt = getDb().prepare(`
    INSERT INTO twitter_posts (content, type, status) 
    VALUES (?, ?, ?)
  `);
  
  const result = insertStmt.run(dummyDraft, 'single', 'draft');
  const dbId = result.lastInsertRowid;

  try {
    const approvalId = await requestApproval('twitter', dbId as number, dummyDraft);
    if (approvalId) {
      console.log(`✅ Success! Requested approval #${approvalId} for fake tweet #${dbId}.`);
      console.log('📱 Check your Telegram App now! You should see an inline keyboard.');
      console.log('👉 Click "Edit" and reply with something like "Make it sound more professional".');
      console.log('👉 Once the edit process is done, you can hit "Approve" and the dashboard will update.');
    } else {
      console.log('❌ Failed to request approval. Check the .env values for TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.');
    }
  } catch (e) {
    console.error('Error:', e);
  }

  // Allow enough time for network request
  setTimeout(() => process.exit(0), 3000);
}

testTelegram();
