export const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export const api = {
  dashboard: {
    stats: () => fetchApi<{
      mailsSent: number;
      replies: number;
      jobsApplied: number;
      linkedinPosts: number;
      twitterPosts: number;
      redditPosts: number;
      mailsToday: number;
      jobsToday: number;
      replyRate: number;
      maxEmailsPerDay: number;
      linkedinMode: string;
      nextWeeklyPostLabel: string;
    }>("/dashboard/stats"),
    activity: () => fetchApi<Array<{ type: string; message: string; created_at: string }>>("/dashboard/activity"),
    queueStatus: () =>
      fetchApi<{ mailPending: number; applyPending: number; mailProcessing: boolean; applyProcessing: boolean }>(
        "/dashboard/queue-status"
      ),
    systemStatus: () =>
      fetchApi<{
        redis: boolean;
        gmail: boolean;
        linkedin: boolean;
        whatsapp: boolean;
        weeklyPostEnabled: boolean;
        dailyLinkedInDraftEnabled: boolean;
        linkedinMode: string;
        nextWeeklyPostLabel: string;
      }>(
        "/dashboard/system-status"
      ),
  },
  coldmail: {
    companies: () => fetchApi<Company[]>("/coldmail/companies"),
    uploadCsv: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return fetch(`${API_BASE}/coldmail/upload-csv`, {
        method: "POST",
        body: form,
        credentials: "include",
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))));
    },
    scrape: (id: number) => fetchApi(`/coldmail/scrape/${id}`, { method: "POST" }),
    scrapeAll: () => fetchApi<{ scraped: number }>("/coldmail/scrape-all", { method: "POST" }),
    generate: (id: number, provider: "gemini" | "grok" = "gemini") =>
      fetchApi<{ subject: string; body: string }>(`/coldmail/generate/${id}`, {
        method: "POST",
        body: JSON.stringify({ provider }),
      }),
    generateAll: (provider: "gemini" | "grok" = "gemini") =>
      fetchApi<{ generated: number }>("/coldmail/generate-all", {
        method: "POST",
        body: JSON.stringify({ provider }),
      }),
    update: (id: number, data: Partial<Company>) =>
      fetchApi(`/coldmail/companies/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    approve: (id: number) => fetchApi(`/coldmail/approve/${id}`, { method: "POST" }),
    approveAll: () => fetchApi<{ approved: number }>("/coldmail/approve-all", { method: "POST" }),
    sendApproved: () => fetchApi<{ queued: number }>("/coldmail/send-approved", { method: "POST" }),
    create: (data: Omit<Company, "id" | "status" | "created_at" | "scraped_context" | "generated_subject" | "generated_mail" | "personalization_hook" | "sent_at" | "reply_detected_at" | "followup_status" | "followup_sent_at">) =>
      fetchApi<Company>("/coldmail/companies", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi(`/coldmail/companies/${id}`, { method: "DELETE" }),
    skip: (id: number) => fetchApi(`/coldmail/skip/${id}`, { method: "POST" }),
  },
  linkedin: {
    scanJobs: (keywords: string, location: string) =>
      fetchApi<{ jobs: Job[]; count: number }>("/linkedin/scan-jobs", {
        method: "POST",
        body: JSON.stringify({ keywords, location }),
      }),
    jobs: () => fetchApi<Job[]>("/linkedin/jobs"),
    apply: (id: number) => fetchApi(`/linkedin/apply/${id}`, { method: "POST" }),
    applyAll: () => fetchApi<{ queued: number }>("/linkedin/apply-all", { method: "POST" }),
    skipJob: (id: number) => fetchApi(`/linkedin/skip-job/${id}`, { method: "POST" }),
    posts: () => fetchApi<Post[]>("/linkedin/posts"),
    generatePost: () =>
      fetchApi<{ id: number; content: string; newsSources: NewsItem[] }>("/linkedin/generate-post", {
        method: "POST",
      }),
    // v2.3: New daily draft generator
    generateDraft: () =>
      fetchApi<{ id: number; content: string; charCount: number; newsSources: NewsItem[] }>("/linkedin/generate-draft", {
        method: "POST",
      }),
    // v2.3: Weekly roundup generator
    generateWeekly: () =>
      fetchApi<{ id: number; content: string; charCount: number; newsSources: NewsItem[] }>("/linkedin/generate-weekly-post", {
        method: "POST",
      }),
    updatePost: (id: number, data: { content?: string; status?: string }) =>
      fetchApi(`/linkedin/posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    // v2.3: Mark as manually posted (replaces publishPost)
    markPosted: (id: number) => fetchApi<{ ok: boolean }>(`/linkedin/mark-posted/${id}`, { method: "POST" }),
    publishPost: (id: number) => fetchApi<{ ok: boolean; url?: string }>(`/linkedin/publish-post/${id}`, { method: "POST" }),
    setWeeklyPost: (enabled: boolean) =>
      fetchApi(`/linkedin/settings/weekly-post`, { method: "PATCH", body: JSON.stringify({ enabled }) }),
  },
  settings: {
    get: () => fetchApi<AppSettings>("/settings/"),
    set: (key: string, value: string) =>
      fetchApi("/settings/", { method: "POST", body: JSON.stringify({ key, value }) }),
    update: (settings: Partial<AppSettings>) =>
      fetchApi("/settings/", { method: "PUT", body: JSON.stringify({ settings }) }),
    testWhatsApp: () => fetchApi<{ ok: boolean }>("/settings/test-whatsapp", { method: "POST" }),
    testResume: () => fetchApi<{ ok: boolean }>("/settings/test-resume", { method: "POST" }),
  },
  logs: {
    recent: (filter?: string, search?: string) =>
      fetchApi<LogEntry[]>(`/logs/recent?filter=${filter ?? "all"}&search=${search ?? ""}`),
  },
  twitter: {
    posts: () => fetchApi<TwitterPost[]>("/twitter/posts"),
    generate: (type: "single" | "thread", topic?: string) =>
      fetchApi<{ success: boolean; dbId: number }>("/twitter/generate", {
        method: "POST",
        body: JSON.stringify({ type, topic }),
      }),
    update: (id: number, data: Partial<TwitterPost>) =>
      fetchApi(`/twitter/posts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  reddit: {
    posts: () => fetchApi<RedditPost[]>("/reddit/posts"),
    generate: (subreddit: string, topic?: string) =>
      fetchApi<{ success: boolean; dbId: number }>("/reddit/generate", {
        method: "POST",
        body: JSON.stringify({ subreddit, topic }),
      }),
    update: (id: number, data: Partial<RedditPost>) =>
      fetchApi(`/reddit/posts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  }
};

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
  sent_at: string | null;
  reply_detected_at: string | null;
  followup_status: string | null;
  followup_sent_at: string | null;
  created_at: string;
}

export interface Job {
  id: number;
  job_title: string;
  company: string;
  location: string;
  job_url: string;
  job_description?: string;
  easy_apply: number;
  status: string;
  applied_at: string | null;
  tailored_resume_summary: string | null;
  created_at: string;
}

export interface Post {
  id: number;
  content: string;
  news_sources: string | null;
  status: string;
  posted_at: string | null;
  linkedin_post_url: string | null;
  created_at: string;
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
}

export interface LogEntry {
  time: string;
  level: string;
  source: string;
  message: string;
}

export interface AppSettings {
  full_name: string;
  target_roles: string;
  target_cities: string;
  phone: string;
  resume_drive_file_id: string;
  weekly_post_enabled: string;
  daily_linkedin_draft_enabled: string;
  max_emails_per_day: string;
  max_applies_per_session: string;
  weekly_post_day: string;
  weekly_post_time: string;
  daily_summary_time: string;
  linkedin_headline: string;
  sender_email: string;
  gmailConfigured: boolean;
  linkedinSessionValid: boolean;
  whatsappConfigured: boolean;
}

export interface TwitterPost {
  id: number;
  content: string;
  type: "single" | "thread";
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
  subreddit: string | null;
  title: string | null;
  content: string;
  status: string;
  posted_at: string | null;
  reddit_post_id: string | null;
  upvotes: number;
  comments: number;
  error_message: string | null;
  created_at: string;
}
