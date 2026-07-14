export const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("outly_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    let errorMsg = res.statusText || `Request failed (${res.status})`;
    let errorData: any = null;
    try {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        errorData = json;
        if (json && (json.error || json.message)) {
          errorMsg = json.error || json.message;
        } else if (text) {
          errorMsg = text;
        }
      } catch {
        if (text) errorMsg = text;
      }
    } catch {
      // fallback to statusText
    }
    const err = new Error(errorMsg) as Error & { data?: any };
    if (errorData) err.data = errorData;
    
    // Trigger the limit modal if a 403 response with a LIMIT_ code is returned
    if (res.status === 403 && errorData?.code?.startsWith("LIMIT_")) {
      const event = new CustomEvent("outly_limit_exceeded", {
        detail: {
          code: errorData.code,
          message: errorData.message || errorMsg,
          unlockAt: errorData.unlockAt,
        }
      });
      window.dispatchEvent(event);
    }
    
    throw err;
  }
  return res.json();
}

export const api = {
  auth: {
    signup: (email: string, password: string, fullName?: string) =>
      fetchApi<{ token: string; user: UserProfile }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName }),
      }),
    login: (email: string, password: string) =>
      fetchApi<{ token: string; user: UserProfile }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    googleLogin: (accessToken: string) =>
      fetchApi<{ token: string; user: UserProfile }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ access_token: accessToken }),
      }),
    me: () =>
      fetchApi<{ user: UserProfile }>("/auth/me"),
    upgrade: (plan: "free" | "pro") =>
      fetchApi<{ token: string; user: UserProfile; message: string }>("/auth/upgrade", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
    logout: () => {
      localStorage.removeItem("outly_token");
      localStorage.removeItem("outly_premium_user");
    }
  },

  dashboard: {
    stats: () => fetchApi<{
      mailsSent: number;
      replies: number;
      mailsToday: number;
      replyRate: number;
      maxEmailsPerDay: number;
      savedCount?: number;
      appliedCount?: number;
      interviewCount?: number;
      offerCount?: number;
      rejectedCount?: number;
    }>("/dashboard/stats"),
    activity: () => fetchApi<Array<{ type: string; message: string; createdAt: string }>>("/dashboard/activity"),
    queueStatus: () =>
      fetchApi<{ mailPending: number; applyPending: number; mailProcessing: boolean; applyProcessing: boolean }>(
        "/dashboard/queue-status"
      ),
    systemStatus: () =>
      fetchApi<{
        redis: boolean;
        gmail: boolean;
        whatsapp: boolean;
      }>(
        "/dashboard/system-status"
      ),
  },
  coldmail: {
    companies: () => fetchApi<Company[]>("/coldmail/companies"),
    uploadCsv: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const token = localStorage.getItem("outly_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      return fetch(`${API_BASE}/coldmail/upload-csv`, {
        method: "POST",
        headers,
        body: form,
        credentials: "include",
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))));
    },
    scrape: (id: string) => fetchApi(`/coldmail/scrape/${id}`, { method: "POST" }),
    scrapeAll: () => fetchApi<{ scraped: number }>("/coldmail/scrape-all", { method: "POST" }),
    generate: (id: string, provider: "gemini" | "grok" | "openrouter" = "gemini", model: string = "gemini-2.5-flash") =>
      fetchApi<{ subject: string; body: string }>(`/coldmail/generate/${id}`, {
        method: "POST",
        body: JSON.stringify({ provider, model }),
      }),
    generateAll: (provider: "gemini" | "grok" | "openrouter" = "gemini", model: string = "gemini-2.5-flash") =>
      fetchApi<{ generated: number }>("/coldmail/generate-all", {
        method: "POST",
        body: JSON.stringify({ provider, model }),
      }),
    update: (id: string, data: Partial<Company>) =>
      fetchApi(`/coldmail/companies/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    approve: (id: string) => fetchApi(`/coldmail/approve/${id}`, { method: "POST" }),
    approveAll: () => fetchApi<{ approved: number }>("/coldmail/approve-all", { method: "POST" }),
    sendApproved: () => fetchApi<{ queued: number }>("/coldmail/send-approved", { method: "POST" }),
    createGmailDraft: (id: string) => fetchApi<{ ok: boolean }>(`/coldmail/create-gmail-draft/${id}`, { method: "POST" }),
    create: (data: Omit<Company, "id" | "status" | "createdAt" | "scraped_context" | "generated_subject" | "generated_mail" | "personalization_hook" | "sent_at" | "reply_detected_at" | "followup_status" | "followup_sent_at">) =>
      fetchApi<Company>("/coldmail/companies", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/coldmail/companies/${id}`, { method: "DELETE" }),
    skip: (id: string) => fetchApi(`/coldmail/skip/${id}`, { method: "POST" }),
  },
  settings: {
    get: () => fetchApi<AppSettings>("/settings"),
    set: (key: string, value: string) =>
      fetchApi("/settings", { method: "POST", body: JSON.stringify({ key, value }) }),
    update: (settings: Partial<AppSettings>) =>
      fetchApi("/settings", { method: "PUT", body: JSON.stringify({ settings }) }),
    testWhatsApp: () => fetchApi<{ ok: boolean }>("/settings/test-whatsapp", { method: "POST" }),
    testResume: () => fetchApi<{ ok: boolean }>("/settings/test-resume", { method: "POST" }),
  },
  logs: {
    recent: (filter?: string, search?: string) =>
      fetchApi<LogEntry[]>(`/logs/recent?filter=${filter ?? "all"}&search=${search ?? ""}`),
  },
  ats: {
    score: (resume: string, jd: string) =>
      fetchApi<EvaluationResult>("/ats/score", {
        method: "POST",
        body: JSON.stringify({ resume, jd }),
      }),
    tailor: (resume: string, jd: string) =>
      fetchApi<{
        tailoredResume: string;
        matchedKeywords: string[];
        missingKeywords: string[] | {
          hard_skills: string[];
          soft_skills: string[];
          tools_technologies: string[];
        };
        sources: Array<{ title: string; url: string; domain: string }>;
      }>("/ats/tailor", {
        method: "POST",
        body: JSON.stringify({ resume, jd }),
      }),
    parseFile: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const token = localStorage.getItem("outly_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      return fetch(`${API_BASE}/ats/parse-file`, {
        method: "POST",
        headers,
        body: form,
        credentials: "include",
      }).then((r) => {
        if (!r.ok) {
          return r.text().then((text) => { throw new Error(text || r.statusText); });
        }
        return r.json() as Promise<{ filename: string; content: string }>;
      });
    },
  },
  applications: {
    list: () => fetchApi<TrackerApplication[]>("/applications"),
    create: (data: Omit<TrackerApplication, "id" | "createdAt" | "updatedAt">) =>
      fetchApi<{ success: boolean; id: string }>("/applications", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<TrackerApplication, "id" | "createdAt">>) =>
      fetchApi<{ success: boolean }>(`/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/applications/${id}`, {
        method: "DELETE",
      }),
  },

  resume: {
    list: () => fetchApi<ResumeVaultItem[]>("/resume"),
    create: (data: { filename: string; label: string; content?: string; is_default?: boolean }) =>
      fetchApi<{ success: boolean; id: string }>("/resume", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    upload: (file: File, label: string) => {
      const form = new FormData();
      form.append("file", file);
      form.append("label", label);
      const token = localStorage.getItem("outly_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      return fetch(`${API_BASE}/resume/upload`, {
        method: "POST",
        headers,
        body: form,
        credentials: "include",
      }).then((r) => {
        if (!r.ok) {
          return r.text().then((text) => { throw new Error(text || r.statusText); });
        }
        return r.json() as Promise<ResumeVaultItem>;
      });
    },
    getFileUrl: (id: string) => `${API_BASE}/resume/${id}/file`,
    setDefault: (id: string) =>
      fetchApi<{ success: boolean }>(`/resume/${id}/default`, {
        method: "POST",
      }),
    update: (id: string, data: { label: string }) =>
      fetchApi<ResumeVaultItem>(`/resume/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/resume/${id}`, {
        method: "DELETE",
      }),
  },
  analytics: {
    get: () =>
      fetchApi<{
        summary: {
          totalSent: number;
          totalReplies: number;
          pending: number;
          approved: number;
          replyRate: number;
          avgReplyDelayHours: number;
        };
        openRateByCompany: Array<{ company: string; sent: number; opened: number; replied: number }>;
        responseRateByEmailType: Array<{ type: string; sent: number; replies: number }>;
        bestSubjectLines: Array<{ subject: string; openRate: number; replyRate: number }>;
        heatmap: Array<{ day: string; hour: string; score: number }>;
      }>("/analytics"),
  },
  scraper: {
    jobs: (role: string, location: string, experience: string) =>
      fetchApi<{
        isLive: boolean;
        jobs: Array<{
          id: string;
          title: string;
          company: string;
          location: string;
          source: string;
          url: string;
          experience: string;
          salary: string;
        }>;
      }>("/scraper/jobs", {
        method: "POST",
        body: JSON.stringify({ role, location, experience }),
      }),
  },
  payment: {
    createOrder: (amount: number, currency: string = "INR") =>
      fetchApi<{ order_id: string; amount: number; currency: string; key_id?: string }>("/create-order", {
        method: "POST",
        body: JSON.stringify({ amount, currency }),
      }),
    verifyPayment: (data: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) =>
      fetchApi<{ success: boolean; message: string; token?: string }>("/verify-payment", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  }
};


export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  profilePic?: string;
  plan: "free" | "pro";
  createdAt: string;
}

export interface ResumeVaultItem {
  id: string;
  filename: string;
  label: string;
  content: string | null;
  is_default: number;
  cloudinaryUrl?: string;
  created_at: string;
}

export interface TrackerApplication {
  id: string;
  company: string;
  role: string;
  jd_url: string | null;
  stage: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
  resume_version_used: string | null;
  notes: string | null;
  email_history: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
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
  id: string;
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
  id: string;
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
  skills: string;
  experience: string;
  phone: string;
  resume_drive_file_id: string;
  max_emails_per_day: string;
  daily_summary_time: string;
  sender_email: string;
  gmailConfigured: boolean;
  whatsappConfigured: boolean;
}

export interface EvaluationResult {
  score: number;
  breakdown?: {
    skills_match: number;
    experience_match: number;
    formatting_readability: number;
    impact_metrics: number;
  };
  matched_keywords: string[];
  missing_keywords: string[] | {
    hard_skills: string[];
    soft_skills: string[];
    tools_technologies: string[];
  };
  experience_analysis?: {
    seniority_match: "Good" | "Fair" | "Poor";
    comments: string;
  };
  formatting_issues?: string[];
  suggestions: string[];
}
