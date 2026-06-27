import mongoose from "mongoose";

// 1. User Model
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  fullName: String,
  profilePic: String,
  plan: { type: String, enum: ["free", "pro"], default: "free" },
  planExpiresAt: Date,
  createdAt: { type: Date, default: Date.now }
});
export const User = mongoose.model("User", UserSchema);

// 2. Company/Leads Model
const CompanySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  company_name: { type: String, required: true },
  role: { type: String, required: true },
  hr_email: { type: String, required: true },
  linkedin_url: String,
  website_url: String,
  target_person_name: String,
  target_person_role: String,
  key_skills: String,
  experience_level: String,
  sender_name: String,
  sender_location: String,
  status: { type: String, default: "pending" },
  scraped_context: String,
  generated_subject: String,
  generated_mail: String,
  personalization_hook: String,
  sent_at: Date,
  reply_detected_at: Date,
  followup_sent_at: Date,
  followup_status: String,
  error_message: String,
  generated_variants_json: String,
  createdAt: { type: Date, default: Date.now }
});
export const Company = mongoose.model("Company", CompanySchema);

// 3. LinkedIn Post Model
const LinkedInPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: String,
  news_sources: String,
  status: { type: String, enum: ["draft", "approved", "posted", "failed"], default: "draft" },
  posted_at: Date,
  linkedin_post_url: String,
  createdAt: { type: Date, default: Date.now }
});
export const LinkedInPost = mongoose.model("LinkedInPost", LinkedInPostSchema);

// 4. Twitter Post Model
const TwitterPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: String,
  type: { type: String, enum: ["single", "thread"], default: "single" },
  status: { type: String, enum: ["draft", "approved", "posted", "failed"], default: "draft" },
  posted_at: Date,
  twitter_post_id: String,
  impressions: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  error_message: String,
  createdAt: { type: Date, default: Date.now }
});
export const TwitterPost = mongoose.model("TwitterPost", TwitterPostSchema);

// 5. Notification Log Model
const NotificationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: String,
  message: String,
  whatsapp_status: String,
  sent_at: { type: Date, default: Date.now }
});
export const NotificationLog = mongoose.model("NotificationLog", NotificationLogSchema);

// 6. Settings Model
const SettingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  key: { type: String, required: true },
  value: String
});
// Compound unique index so each user can have only one value per key
SettingSchema.index({ userId: 1, key: 1 }, { unique: true });
export const Setting = mongoose.model("Setting", SettingSchema);

// 7. Activity Log Model
const ActivityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  meta: String,
  createdAt: { type: Date, default: Date.now }
});
export const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);

// 8. Application Model
const ApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  jd_url: String,
  stage: { type: String, enum: ['saved', 'applied', 'interview', 'offer', 'rejected'], default: 'saved' },
  resume_version_used: String,
  notes: String,
  email_history: { type: String, default: "[]" }, // Saved as JSON string for compatibility
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
export const Application = mongoose.model("Application", ApplicationSchema);

// 9. Resume Vault Model
const ResumeVaultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: { type: String, required: true },
  label: { type: String, required: true },
  content: String,
  is_default: { type: Number, default: 0 }, // 0 or 1 for compatibility
  cloudinaryUrl: String,
  createdAt: { type: Date, default: Date.now }
});
export const ResumeVault = mongoose.model("ResumeVault", ResumeVaultSchema);
