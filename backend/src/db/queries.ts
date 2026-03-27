import { DatabaseSync } from "node:sqlite";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

let _db: any = null;

export function getDb() {
  if (!_db) {
    _db = new DatabaseSync(env.DB_PATH);
  }
  return _db;
}

export interface Company {
  id: number;
  company_name: string;
  role: string;
  hr_email: string;
  linkedin_url: string | null;
  website_url: string | null;
  target_person_name: string | null;
  target_person_role: string | null;
  key_skills: string | null;
  experience_level: string | null;
  sender_name: string | null;
  sender_location: string | null;
  status: string;
  scraped_context: string | null;
  generated_subject: string | null;
  generated_mail: string | null;
  personalization_hook: string | null;
  followup_sent_at: string | null;
  followup_status: string | null;
  sent_at: string | null;
  reply_detected_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface LinkedInPost {
  id: number;
  content: string;
  news_sources: string;
  status: string;
  posted_at: string | null;
  linkedin_post_url: string | null;
  created_at: string;
}

export interface TwitterPost {
  id: number;
  content: string;
  type: 'single' | 'thread';
  status: string;
  posted_at: string | null;
  twitter_post_id: string | null;
  impressions: number;
  likes: number;
  replies: number;
  error_message: string | null;
  created_at: string;
}

export interface RedditPost {
  id: number;
  subreddit: string;
  title: string;
  content: string;
  status: string;
  posted_at: string | null;
  reddit_post_id: string | null;
  upvotes: number;
  comments: number;
  error_message: string | null;
  created_at: string;
}

export const companyQueries = {
  getAll: () =>
    getDb()
      .prepare("SELECT * FROM companies ORDER BY created_at DESC")
      .all() as Company[],

  getById: (id: number) =>
    getDb().prepare("SELECT * FROM companies WHERE id = ?").get(id) as Company | undefined,

  getByStatus: (status: string) =>
    getDb()
      .prepare("SELECT * FROM companies WHERE status = ?")
      .all(status) as Company[],

  getDueForFollowUp: (days: number) =>
    getDb()
      .prepare(`
        SELECT * FROM companies 
        WHERE status = 'mail_sent' 
        AND followup_status IS NULL
        AND sent_at <= date('now', '-' || ? || ' days')
      `)
      .all(days) as Company[],

  insert: (company: Omit<Company, "id" | "created_at">) => {
    const stmt = getDb().prepare(`
      INSERT INTO companies (
        company_name, role, hr_email, linkedin_url, website_url, 
        target_person_name, target_person_role, key_skills, 
        experience_level, sender_name, sender_location,
        status, scraped_context, generated_subject, generated_mail, 
        personalization_hook, sent_at, reply_detected_at, 
        followup_sent_at, followup_status, error_message
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      company.company_name,
      company.role,
      company.hr_email,
      company.linkedin_url ?? null,
      company.website_url ?? null,
      company.target_person_name ?? null,
      company.target_person_role ?? null,
      company.key_skills ?? null,
      company.experience_level ?? null,
      company.sender_name ?? null,
      company.sender_location ?? null,
      company.status,
      company.scraped_context ?? null,
      company.generated_subject ?? null,
      company.generated_mail ?? null,
      company.personalization_hook ?? null,
      company.sent_at ?? null,
      company.reply_detected_at ?? null,
      company.followup_sent_at ?? null,
      company.followup_status ?? null,
      company.error_message ?? null
    );
  },

  update: (id: number, company: Partial<Company>) => {
    const keys = Object.keys(company).filter((k) => k !== "id");
    const sets = keys.map((k) => `${k} = ?`);
    const vals = keys.map((k) => (company as any)[k]);
    if (sets.length === 0) return { changes: 0 };

    const query = `UPDATE companies SET ${sets.join(", ")} WHERE id = ?`;
    return getDb().prepare(query).run(...vals, id);
  },

  updateStatus: (id: number, status: string, extra?: Partial<Company>) => {
    const updates = ["status = ?"];
    const values: any[] = [status];

    if (extra) {
      Object.keys(extra).forEach((key) => {
        if (key !== "status" && key !== "id") {
          updates.push(`${key} = ?`);
          values.push((extra as any)[key]);
        }
      });
    }

    const query = `UPDATE companies SET ${updates.join(", ")} WHERE id = ?`;
    return getDb().prepare(query).run(...values, id);
  },

  delete: (id: number) =>
    getDb().prepare("DELETE FROM companies WHERE id = ?").run(id),

  countMailSent: () => {
    const res = getDb().prepare("SELECT COUNT(*) as count FROM companies WHERE sent_at IS NOT NULL").get() as any;
    return Number(res?.count ?? 0);
  },

  countMailsSentToday: () => {
    const res = getDb()
      .prepare("SELECT COUNT(*) as count FROM companies WHERE date(sent_at) = date('now')")
      .get() as any;
    return Number(res?.count ?? 0);
  },

  countReplies: () => {
    const res = getDb().prepare("SELECT COUNT(*) as count FROM companies WHERE status = 'replied'").get() as any;
    return Number(res?.count ?? 0);
  },

  countMailsSentThisWeek: () => {
    const res = getDb()
      .prepare("SELECT COUNT(*) as count FROM companies WHERE sent_at >= date('now', '-7 days')")
      .get() as any;
    return Number(res?.count ?? 0);
  },

  countRepliesThisWeek: () => {
    const res = getDb()
      .prepare(
        "SELECT COUNT(*) as count FROM companies WHERE status = 'replied' AND reply_detected_at >= date('now', '-7 days')"
      )
      .get() as any;
    return Number(res?.count ?? 0);
  },
};

export const postQueries = {
  getAll: () => getDb().prepare("SELECT * FROM linkedin_posts ORDER BY created_at DESC").all() as any[],
  getById: (id: number) => getDb().prepare("SELECT * FROM linkedin_posts WHERE id = ?").get(id) as any,
  insert: (post: any) => {
    const stmt = getDb().prepare(`
      INSERT INTO linkedin_posts (content, news_sources, status, posted_at, linkedin_post_url)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(post.content, post.news_sources, post.status, post.posted_at, post.linkedin_post_url);
  },
  update: (id: number, post: Partial<any>) => {
    const keys = Object.keys(post).filter((k) => k !== "id");
    const sets = keys.map((k) => `${k} = ?`);
    const vals = keys.map((k) => (post as any)[k]);
    const query = `UPDATE linkedin_posts SET ${sets.join(", ")} WHERE id = ?`;
    return getDb().prepare(query).run(...vals, id);
  },
  updateStatus: (id: number, status: string, extra?: any) => {
    const updates = ["status = ?"];
    const values: any[] = [status];
    if (extra?.posted_at) {
      updates.push("posted_at = ?");
      values.push(extra.posted_at);
    }
    if (extra?.linkedin_post_url) {
      updates.push("linkedin_post_url = ?");
      values.push(extra.linkedin_post_url);
    }
    const query = `UPDATE linkedin_posts SET ${updates.join(", ")} WHERE id = ?`;
    return getDb().prepare(query).run(...values, id);
  },
  countPosted: () => {
    const res = getDb().prepare("SELECT COUNT(*) as count FROM linkedin_posts WHERE status = 'posted'").get() as any;
    return Number(res?.count ?? 0);
  },
};

export const twitterQueries = {
  getAll: (limit = 50) =>
    getDb().prepare("SELECT * FROM twitter_posts ORDER BY created_at DESC LIMIT ?").all(limit) as any[],
  getById: (id: number) => getDb().prepare("SELECT * FROM twitter_posts WHERE id = ?").get(id) as any,
  insert: (tweet: any) => {
    const stmt = getDb().prepare(`
      INSERT INTO twitter_posts (content, type, status, posted_at, twitter_post_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(tweet.content, tweet.type, tweet.status, tweet.posted_at, tweet.twitter_post_id);
  },
  update: (id: number, tweet: Partial<any>) => {
    const keys = Object.keys(tweet).filter((k) => k !== "id");
    const sets = keys.map((k) => `${k} = ?`);
    const vals = keys.map((k) => (tweet as any)[k]);
    const query = `UPDATE twitter_posts SET ${sets.join(", ")} WHERE id = ?`;
    return getDb().prepare(query).run(...vals, id);
  },
  countPosted: () => {
    const res = getDb().prepare("SELECT COUNT(*) as count FROM twitter_posts WHERE status = 'posted'").get() as any;
    return Number(res?.count ?? 0);
  },
};

export const redditQueries = {
  getAll: (limit = 50) =>
    getDb().prepare("SELECT * FROM reddit_posts ORDER BY created_at DESC LIMIT ?").all(limit) as any[],
  getById: (id: number) => getDb().prepare("SELECT * FROM reddit_posts WHERE id = ?").get(id) as any,
  insert: (post: any) => {
    const stmt = getDb().prepare(`
      INSERT INTO reddit_posts (subreddit, title, content, status, posted_at, reddit_post_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(post.subreddit, post.title, post.content, post.status, post.posted_at, post.reddit_post_id);
  },
  update: (id: number, post: Partial<any>) => {
    const keys = Object.keys(post).filter((k) => k !== "id");
    const sets = keys.map((k) => `${k} = ?`);
    const vals = keys.map((k) => (post as any)[k]);
    const query = `UPDATE reddit_posts SET ${sets.join(", ")} WHERE id = ?`;
    return getDb().prepare(query).run(...vals, id);
  },
  countPosted: () => {
    const res = getDb().prepare("SELECT COUNT(*) as count FROM reddit_posts WHERE status = 'posted'").get() as any;
    return Number(res?.count ?? 0);
  },
};

export const approvalQueries = {
  getById: (id: number) => getDb().prepare("SELECT * FROM pending_approvals WHERE id = ?").get(id) as any,
  getAllPending: () => getDb().prepare("SELECT * FROM pending_approvals WHERE status = 'waiting'").all() as any[],
  insert: (approval: any) => {
    const stmt = getDb().prepare(`
      INSERT INTO pending_approvals (platform, post_id, draft_content, status)
      VALUES (?, ?, ?, 'waiting')
    `);
    return stmt.run(approval.platform, approval.post_id, approval.draft_content);
  },
  update: (id: number, updates: any) => {
    const keys = Object.keys(updates).filter((k) => k !== "id");
    const sets = keys.map((k) => `${k} = ?`);
    const vals = keys.map((k) => updates[k]);
    const query = `UPDATE pending_approvals SET ${sets.join(", ")} WHERE id = ?`;
    return getDb().prepare(query).run(...vals, id);
  },
};

export const settingsQueries = {
  get: (key: string) => (getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as any)?.value,
  set: (key: string, value: string) => {
    const stmt = getDb().prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    return stmt.run(key, value);
  },
};

export const notificationsQueries = {
  insert: (type: string, message: string, whatsappStatus: string) => {
    const stmt = getDb().prepare("INSERT INTO notifications_log (type, message, whatsapp_status) VALUES (?, ?, ?)");
    return stmt.run(type, message, whatsappStatus);
  },
  getRecent: (limit: number) =>
    getDb().prepare("SELECT * FROM notifications_log ORDER BY sent_at DESC LIMIT ?").all(limit) as any[],
};

export const activityQueries = {
  add: (type: string, message: string, meta?: any) => {
    const stmt = getDb().prepare("INSERT INTO activity_log (type, message, meta) VALUES (?, ?, ?)");
    return stmt.run(type, message, meta ? JSON.stringify(meta) : null);
  },
  getRecent: (limit: number) =>
    getDb().prepare("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?").all(limit) as any[],
};
