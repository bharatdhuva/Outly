import { getDb } from "./src/db/queries.js";
try {
  const db = getDb();
  const res = db.prepare("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)").run();
  console.log("RUN RESULT:", res);
  const res2 = db.prepare("INSERT INTO test DEFAULT VALUES").run();
  console.log("INSERT RESULT:", res2);
} catch (e) {
  console.error(e);
}
process.exit(0);
