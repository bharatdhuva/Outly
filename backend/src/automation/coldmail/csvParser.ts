import fs from "fs";
import { companyQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";

export interface CompanyRow {
  company_name: string;
  role: string;
  hr_email: string;
  linkedin_url?: string;
  website_url?: string;
  target_person_name?: string;
  target_person_role?: string;
  key_skills?: string;
  experience_level?: string;
  sender_name?: string;
  sender_location?: string;
  personalization_hook?: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === "," && !inQuotes) || c === "\n" || c === "\r") {
      result.push(current.trim());
      current = "";
      if (c === "\n" || c === "\r") break;
    } else {
      current += c;
    }
  }
  if (current.length > 0) result.push(current.trim());
  return result;
}

export function parseCompaniesCSV(filePath: string): CompanyRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const companies: CompanyRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 3) continue;
    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    companies.push({
      company_name: row.company_name ?? row.company ?? "",
      role: row.role ?? "",
      hr_email: row.hr_email ?? row.email ?? row.target_email ?? "",
      linkedin_url: row.linkedin_url ?? row.linkedin ?? undefined,
      website_url: row.website_url ?? row.website ?? undefined,
      target_person_name: row.target_person_name ?? row.name ?? undefined,
      target_person_role: row.target_person_role ?? undefined,
      key_skills: row.key_skills ?? row.skills ?? undefined,
      experience_level: row.experience_level ?? undefined,
      sender_name: row.sender_name ?? row.your_name ?? undefined,
      sender_location: row.sender_location ?? row.your_location ?? undefined,
      personalization_hook: row.personalization_hook ?? undefined,
    });
  }
  return companies;
}

export function importCompaniesFromCSV(filePath: string): number {
  const companies = parseCompaniesCSV(filePath);
  let inserted = 0;
  for (const c of companies) {
    if (!c.company_name || !c.role || !c.hr_email) continue;
    try {
      companyQueries.insert({
        company_name: c.company_name,
        role: c.role,
        hr_email: c.hr_email,
        linkedin_url: c.linkedin_url ?? null,
        website_url: c.website_url ?? null,
        target_person_name: c.target_person_name ?? null,
        target_person_role: c.target_person_role ?? null,
        key_skills: c.key_skills ?? null,
        experience_level: c.experience_level ?? null,
        sender_name: c.sender_name ?? null,
        sender_location: c.sender_location ?? null,
        status: "pending",
        scraped_context: null,
        generated_subject: null,
        generated_mail: null,
        personalization_hook: c.personalization_hook ?? null,
        sent_at: null,
        reply_detected_at: null,
        followup_sent_at: null,
        followup_status: null,
        error_message: null,
      });
      inserted++;
    } catch (e) {
      logger.warn("Skip duplicate or invalid row", { company: c.company_name, error: String(e) });
    }
  }
  logger.info(`Imported ${inserted} companies from CSV`, { source: "coldmail" });
  return inserted;
}
