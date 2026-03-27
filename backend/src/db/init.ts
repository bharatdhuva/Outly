import { getDb } from "./queries.js";
import { SCHEMA } from "./schema.js";
import { env } from "../config/env.js";
import fs from "fs";
import path from "path";

async function init() {
  const dataDir = path.dirname(env.DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
  }

  const db = getDb();
  db.exec(SCHEMA);

  // Migration for ALL new lead fields if table already existed
  const cols = [
    "target_person_name", 
    "target_person_role", 
    "key_skills", 
    "experience_level", 
    "sender_name", 
    "sender_location",
    "personalization_hook",
    "followup_sent_at",
    "followup_status",
    "scraped_context",
    "generated_subject",
    "generated_mail",
    "error_message"
  ];
  
  const existingCols = db.prepare("PRAGMA table_info(companies)").all() as any[];
  const existingColNames = existingCols.map(c => c.name);

  cols.forEach(col => {
    if (!existingColNames.includes(col)) {
      try {
        db.exec(`ALTER TABLE companies ADD COLUMN ${col} TEXT;`);
        console.log(`✅ Migrated: added column ${col} to companies`);
      } catch (e) {
        console.warn(`⚠️ Migration failed for ${col}: ${String(e)}`);
      }
    }
  });

  console.log("✅ Database initialized and migrated successfully at", env.DB_PATH);
  process.exit(0);
}

init().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
