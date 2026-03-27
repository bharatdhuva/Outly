import { companyQueries } from "./src/db/queries.js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, ".env") });

try {
  const result = companyQueries.insert({
    company_name: "Test Company",
    role: "Software Intern",
    hr_email: "test@example.com",
    status: "pending"
  } as any);
  console.log("Success! Inserted lead with ID:", result.lastInsertRowid);
  
  const companies = companyQueries.getAll();
  console.log("Success! Found", companies.length, "companies.");
} catch (e) {
  console.error("Failed:", e);
}
