# Outly 🚀 — Workspace Overview & Feature Documentation

Outly is an AI-powered job application and career outreach automation platform. It is designed to automate the repetitive and tedious parts of job hunting, such as cold emailing, resume tailoring, content creation, and application tracking, letting job seekers focus on interview preparation.

---

## 🛠️ Technology Stack
*   **Frontend:** React.js, Vite, Tailwind CSS, Lucide Icons, Shadcn UI components.
*   **Backend:** Node.js, Express.js (TypeScript).
*   **Database:** SQLite (`outly.db` via `better-sqlite3` driver).
*   **AI Models:** Google Gemini & Grok (via API integration).
*   **Queuing & Background Jobs:** Bull Queue + Redis for robust, fault-tolerant background scheduling.
*   **Integrations:** Gmail API (via Google OAuth 2.0), LinkedIn automation, Twilio WhatsApp API, Telegram Bot API.

---

## 🌟 Currently Implemented Features

### 1. Unified Dashboard (Overview)
*   **Status Badges:** Real-time health monitoring of Redis, Gmail, LinkedIn, WhatsApp, and Telegram integrations.
*   **Response Rate Tracker:** Displays the percentage of replied outreach emails against total mails sent.
*   **Social Calendar Indicator:** Shows the time and content of the next scheduled post.
*   **Quick Actions Bar:** Double-click access to compose cold emails, tailor resumes, check ATS scores, or track applications.
*   **Kanban Pipeline Preview:** A quick-count indicator of jobs in various stages: Saved, Applied, Interview, Offer, Rejected.
*   **Activity Streak (LeetCode & GitHub style):**
    *   91-day historical contribution grid of active job hunts.
    *   Interactive tooltips showing exact activity counts on hover.
    *   Flame/streak widgets tracking current and max active streaks.
*   **Activity Feed:** Aggregates and displays the latest 5 activities performed in the workspace.

### 2. AI Cold Email Generator (`/cold-mail`)
*   **Target List Management:** Upload CSV files to bulk import targets or add manually.
*   **Auto Company Scraping:** Scrapes company websites to extract contextual keywords.
*   **AI Copywriter (Gemini/Grok):** Generates subject lines, personalization hooks, and email body copies.
*   **Email Variants:** Generate Formal, Casual, or Short styles of emails.
*   **A/B/C Subject Options:** Multiple email subjects generated for testing.
*   **Follow-Up Sequence Generator:** Auto-generates a 3-step sequence (Day 1, Day 4, and Day 7 follow-ups) for unresponsive targets.

### 3. Applications Kanban Tracker (`/applications`)
*   **Drag-and-Drop Columns:** Move applications visually between *Saved*, *Applied*, *Interview*, *Offer*, and *Rejected*.
*   **Detail Side Drawer:**
    *   Attach notes, Job Description links, and log interview schedules.
    *   Dropdown selection of which resume version from the Vault was sent.
    *   View status update history and automated emails sent to the company.
*   **Integrated Job Scraper:** Auto-fetch job postings from platforms (LinkedIn, Naukri, Internshala, Wellfound) using Apify crawler configurations.

### 4. ATS Resume Score Checker (`/ats-score`)
*   **Direct Comparison:** Compares resume text (.txt upload or paste) with a pasted Job Description.
*   **Score Dial:** Graphic radial representation of match probability (0–100%).
*   **Missing Keywords:** Highlights critical SDE/role keywords present in the JD but missing in your resume.
*   **Actionable Tips:** Gives a numbered list of structural and contextual changes to help beat filters.

### 5. Resume Tailor (`/resume-tailor`)
*   **ATS Customization:** Rewrites resume descriptions using OpenAI/Gemini to match the specific keywords and requirements of target Job Descriptions.

### 6. Cover Letter Generator (`/cover-letter`)
*   **Tone Adjustments:** Create customized cover letters with Professional, Conversational, or Enthusiastic tones.
*   **Direct Editing:** In-app editor to finalize the letter before copying or downloading.

### 7. LinkedIn & Twitter Schedulers (`/linkedin-posts`, `/twitter`)
*   **Post Composer:** Write, generate, and preview social posts with character counts.
*   **Voice Copying:** Analyzes previously written posts to copy the user's specific tone/style.
*   **Content Calendar:** Drag-and-drop posts in a monthly/weekly calendar to queue publishing.

### 8. Analytics & Admin Tools
*   **Outreach Metrics (`/analytics`):** Detailed response charts across email styles, heatmap of highest response timings, and email open status indicators.
*   **Resume Vault (Partial Backend/UI Tab):** Database tables, APIs, and settings-tab interfaces are implemented for storing multiple resume versions, but it is not yet integrated with other tools.
*   **Activity Logs (`/logs`):** Access detailed developer logs of background scraper tasks, queued emails, and system operations.

---

## 🚧 Work Remaining & Future Roadmap

1.  **Multi-user SaaS Mode:**
    *   Add user registrations, sessions management, database partitioning, and subscription handlers to make Outly commercializable.
2.  **Browser Chrome Extension:**
    *   Build a Chrome Extension to let users capture job listings directly from LinkedIn, Indeed, and Wellfound, adding them to the Kanban tracker in one click.
3.  **Advanced Auto-Send Engine:**
    *   Automate sending approved Gmail drafts directly from the queue at optimal times (using the heatmap analytics), instead of drafting them for manual sending.
4.  **Live Scraping API Keys:**
    *   Replace simulated job scraping behaviors on Naukri/Internshala with direct API tokens and live Apify scraping accounts.
5.  **Multi-Format Document Parser:**
    *   Expand the ATS score checker to parse `.pdf` and `.docx` files directly (currently only reads `.txt` formats).
6.  **Resume Vault Integration:**
    *   Integrate the Resume Vault with the **ATS Score Checker** and **Resume Tailor** pages, so users can load stored resumes from settings directly instead of uploading/pasting every time.
