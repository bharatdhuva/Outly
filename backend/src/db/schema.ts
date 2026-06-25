export const SCHEMA = `
-- companies
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  hr_email TEXT NOT NULL,
  linkedin_url TEXT,
  website_url TEXT,
  target_person_name TEXT,
  target_person_role TEXT,
  key_skills TEXT,
  experience_level TEXT,
  sender_name TEXT,
  sender_location TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'scraped', 'mail_generated', 'approved', 'mail_sent', 'replied', 'bounced', 'skipped')),
  scraped_context TEXT,
  generated_subject TEXT,
  generated_mail TEXT,
  personalization_hook TEXT,
  sent_at DATETIME,
  reply_detected_at DATETIME,
  followup_sent_at DATETIME,
  followup_status TEXT,
  error_message TEXT,
  generated_variants_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);



-- linkedin_posts
CREATE TABLE IF NOT EXISTS linkedin_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT,
  news_sources TEXT,
  status TEXT CHECK(status IN ('draft', 'approved', 'posted', 'failed')),
  posted_at DATETIME,
  linkedin_post_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- twitter_posts
CREATE TABLE IF NOT EXISTS twitter_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT,
  type TEXT CHECK(type IN ('single', 'thread')),
  status TEXT CHECK(status IN ('draft', 'approved', 'posted', 'failed')),
  posted_at DATETIME,
  twitter_post_id TEXT,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- notifications_log
CREATE TABLE IF NOT EXISTS notifications_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  message TEXT,
  whatsapp_status TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- activity_log for dashboard feed
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  meta TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- applications
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  jd_url TEXT,
  stage TEXT DEFAULT 'saved' CHECK(stage IN ('saved', 'applied', 'interview', 'offer', 'rejected')),
  resume_version_used TEXT,
  notes TEXT,
  email_history TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- resume_vault
CREATE TABLE IF NOT EXISTS resume_vault (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  label TEXT NOT NULL,
  content TEXT,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_twitter_posts_status ON twitter_posts(status);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(stage);
`;
