import { settingsQueries } from "../db/queries.js";
import { env } from "./env.js";

export const editableSettingDefaults = {
  full_name: "",
  target_roles: "",
  target_cities: "",
  skills: "",
  experience: "",
  phone: env.YOUR_WHATSAPP_NUMBER,
  resume_drive_file_id: env.RESUME_DRIVE_FILE_ID,
  weekly_post_enabled: "true",
  daily_linkedin_draft_enabled: "true",
  max_emails_per_day: String(env.MAX_EMAILS_PER_DAY),
  max_applies_per_session: String(env.MAX_APPLIES_PER_SESSION),
  weekly_post_day: "Monday",
  weekly_post_time: "09:00 AM IST",
  daily_summary_time: "08:00 PM IST",
  linkedin_headline: "Career Autopilot",
} as const;

export type EditableSettingKey = keyof typeof editableSettingDefaults;

export async function getEditableSetting(userId: string, key: EditableSettingKey): Promise<string> {
  const val = await settingsQueries.get(userId, key);
  return val ?? editableSettingDefaults[key];
}

export async function getEditableSettings(userId: string): Promise<Record<EditableSettingKey, string>> {
  const acc = {} as Record<EditableSettingKey, string>;
  for (const currentKey of Object.keys(editableSettingDefaults)) {
    const key = currentKey as EditableSettingKey;
    acc[key] = await getEditableSetting(userId, key);
  }
  return acc;
}

export async function getSenderName(userId: string): Promise<string> {
  return (await getEditableSetting(userId, "full_name")) || "Outly User";
}

export function getSenderEmail(): string {
  return env.GMAIL_USER;
}

export async function getWhatsAppNumber(userId: string): Promise<string> {
  return await getEditableSetting(userId, "phone");
}

export async function getResumeDriveFileId(userId: string): Promise<string> {
  return await getEditableSetting(userId, "resume_drive_file_id");
}

export async function getWeeklyPostLabel(userId: string): Promise<string> {
  const day = await getEditableSetting(userId, "weekly_post_day");
  const time = await getEditableSetting(userId, "weekly_post_time");
  return `${day} ${time}`.trim();
}
