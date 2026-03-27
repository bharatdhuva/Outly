import { settingsQueries } from "../db/queries.js";
import { env } from "./env.js";

export const editableSettingDefaults = {
  full_name: "",
  target_roles: "",
  target_cities: "",
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

export function getEditableSetting(key: EditableSettingKey): string {
  return settingsQueries.get(key) ?? editableSettingDefaults[key];
}

export function getEditableSettings(): Record<EditableSettingKey, string> {
  return Object.keys(editableSettingDefaults).reduce((acc, currentKey) => {
    const key = currentKey as EditableSettingKey;
    acc[key] = getEditableSetting(key);
    return acc;
  }, {} as Record<EditableSettingKey, string>);
}

export function getSenderName(): string {
  return getEditableSetting("full_name") || "JobOS User";
}

export function getSenderEmail(): string {
  return env.GMAIL_USER;
}

export function getWhatsAppNumber(): string {
  return getEditableSetting("phone");
}

export function getResumeDriveFileId(): string {
  return getEditableSetting("resume_drive_file_id");
}

export function getWeeklyPostLabel(): string {
  return `${getEditableSetting("weekly_post_day")} ${getEditableSetting("weekly_post_time")}`.trim();
}
