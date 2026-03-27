import { getDb } from './src/db/queries.js';
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, ".env") });

try {
  const db = getDb();
  console.log("COLUMNS:");
  console.log(db.prepare('PRAGMA table_info(companies)').all());
  console.log("TABLES:");
  console.log(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
} catch (e) {
  console.error(e);
}
process.exit(0);
