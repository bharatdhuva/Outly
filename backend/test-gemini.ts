import { config } from "dotenv";
config();
import { generateMailForCompany } from "./src/automation/coldmail/mailGenerator.js";
import { companyQueries } from "./src/db/queries.js";

async function run() {
  const companies = companyQueries.getAll();
  console.log(`Found ${companies.length} companies in DB.`);
  
  if (companies.length > 0) {
    const target = companies[0];
    console.log(`Generating mail for: ${target.company_name} (ID: ${target.id})`);
    
    // We need to set it to scraped first since generator only accepts pending/scraped
    companyQueries.updateStatus(target.id, "scraped", { scraped_context: JSON.stringify({ about: "Test context" }) });
    
    try {
      const result = await generateMailForCompany(target.id);
      console.log("Success! Generated Mail:");
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error("Generation failed:", e);
    }
  } else {
    console.log("No companies found to test. Did the CSV import?");
  }
}

run();
