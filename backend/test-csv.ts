import { importCompaniesFromCSV } from "./src/automation/coldmail/csvParser.js";
import fs from "fs";

const testCsv = `company_name,role,hr_email,website_url
OpenAI,AI Engineer,hr@openai.com,https://openai.com
Google,Software Engineer,hr@google.com,https://google.com`;

fs.writeFileSync("test.csv", testCsv);
const count = importCompaniesFromCSV("test.csv");
console.log(`Imported: ${count}`);
