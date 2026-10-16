# Outly — Technical Architecture & Interview Study Guide

> **Project Overview:**  
> **Outly** is an AI-powered Personal Career Automation and Job Search Intelligence Platform. It streamlines the end-to-end recruitment lifecycle for candidates: **AI Resume Audit & ATS Scoring**, **AI-Powered Resume Tailoring** (with grounded real-time web search), **Cold Email Automation with Lead Scraping**, **Automated Multi-Day Follow-Up Sequences**, **Multi-Board Job Scraping**, **Visual Kanban Application Tracking**, **WhatsApp Daily Briefings**, and a **Subscription & Billing System** (Razorpay Pro Tier).

---

## 1. Complete Project Structure

```text
Outly/
├── .github/                      # CI/CD workflows and actions
├── api/
│   └── index.js                  # Serverless entrypoint adapter (e.g. for Vercel deployment)
├── backend/                      # Express.js + TypeScript Backend Service
│   ├── data/                     # Local data storage, uploads, and resume binary cache
│   │   ├── resumes/              # Cached binary resume files (.pdf, .docx, .txt)
│   │   └── uploads/              # Staging area for multi-part file uploads (CSV, Resumes)
│   ├── docs/
│   │   └── coldmail-format.md    # Domain rules & guidelines for cold email formatting
│   ├── logs/                     # Winston rotating log files (combined.log, error.log)
│   ├── scripts/                  # Administrative & utility scripts
│   │   ├── send-sample-upgrade.ts# Manual test script for upgrade emails
│   │   ├── setup-gmail.ts        # OAuth2 token retrieval assistant for Gmail API
│   │   └── upgrade-user.ts       # Database CLI helper to manually change user plan tier
│   ├── src/
│   │   ├── index.ts              # Root server entrypoint; starts HTTP server, crons & workers
│   │   ├── api/
│   │   │   ├── server.ts         # Express server configuration, middleware chain, route mounting
│   │   │   └── routes/           # Modular route controllers
│   │   │       ├── analytics.routes.ts      # Open rates, reply rates, email heatmaps
│   │   │       ├── applications.routes.ts   # Application tracker (Kanban CRUD)
│   │   │       ├── ats.routes.ts            # Resume scoring, ATS parsing, and AI tailoring
│   │   │       ├── auth.routes.ts           # Signup, Login, Google OAuth, Profile, Upgrade
│   │   │       ├── coldmail.routes.ts       # Lead generation, CSV import, AI draft generation
│   │   │       ├── contentPosts.routes.ts   # Social post generation & scheduling
│   │   │       ├── dashboard.routes.ts      # Aggregated metrics, activity feed, system health
│   │   │       ├── logs.routes.ts           # Real-time backend Winston log reader
│   │   │       ├── payment.routes.ts        # Razorpay Order creation & HMAC-SHA256 verification
│   │   │       ├── resume.routes.ts         # Multi-file Resume Vault with binary download streaming
│   │   │       ├── scraper.routes.ts        # Live job search via JSearch RapidAPI
│   │   │       ├── settings.routes.ts       # User-level configuration & preferences
│   │   │       └── whatsapp.routes.ts       # WhatsApp Web client pairing QR & test ping
│   │   ├── automation/
│   │   │   └── coldmail/         # Cold outreach business logic
│   │   │       ├── companyScraper.ts        # Public interface & fallback for scraping
│   │   │       ├── companyScraper.private.ts# Cheerio web scraper, Clearbit domain lookup, NewsAPI
│   │   │       ├── csvParser.ts             # CSV lead importer with deduplication
│   │   │       ├── followUpEngine.ts        # Follow-up email generator interface
│   │   │       ├── followUpEngine.private.ts# AI context-aware follow-up prompt builder
│   │   │       ├── mailGenerator.ts         # AI cold email generator interface
│   │   │       ├── mailGenerator.private.ts # Gemini / Groq / Claude / OpenRouter email engine
│   │   │       ├── mailSender.ts            # Public email dispatch interface
│   │   │       └── mailSender.private.ts    # Brevo API / Gmail OAuth2 Nodemailer transport
│   │   ├── config/
│   │   │   ├── appSettings.ts    # Dynamic user settings resolver from MongoDB
│   │   │   └── env.ts            # Strongly typed environment variables validation
│   │   ├── db/
│   │   │   ├── connection.ts     # Resilient MongoDB Mongoose connection manager
│   │   │   ├── init.ts           # Database seeding and migration helper
│   │   │   ├── models.ts         # Mongoose schema definitions (User, Company, Resume, etc.)
│   │   │   ├── queries.ts        # Abstracted Data Access Layer (DAL) / Repository functions
│   │   │   └── schema.ts         # Legacy SQLite schema & table documentation
│   │   ├── drive/
│   │   │   └── googleDrive.ts    # Google Drive API file download client
│   │   ├── jobs/                 # Node-Cron Scheduled Background Tasks
│   │   │   ├── dailySummary.cron.ts     # Daily metric digest sent via WhatsApp
│   │   │   ├── followUpChecker.cron.ts  # Identifies stale emails and schedules follow-ups
│   │   │   ├── keepAlive.cron.ts        # HTTP ping self-healer for free hosting spin-downs
│   │   │   └── weeklyReport.cron.ts     # Weekly progress aggregations
│   │   ├── lib/                  # Shared utilities & 3rd-party integrations
│   │   │   ├── cloudinary.ts     # Cloudinary asset uploader
│   │   │   ├── logger.ts         # Winston multi-transport logging system
│   │   │   └── resumeValidator.ts# Heuristic ATS text and job description validation
│   │   ├── middleware/           # Express Custom Middlewares
│   │   │   ├── auth.ts           # JWT extraction and verification middleware (`requireAuth`)
│   │   │   ├── limits.ts         # Tier rate limiters (Rolling 12-hour windows for Free tier)
│   │   │   ├── sanitize.ts       # NoSQL Injection sanitizer
│   │   │   └── upload.ts         # Multer disk-storage & file filter configurations
│   │   ├── notifications/        # External alerting systems
│   │   │   ├── whatsapp.ts       # Unified WhatsApp notifier (Twilio fallback)
│   │   │   └── whatsappWeb.ts    # Headless Puppeteer-backed WhatsApp Web integration
│   │   └── queue/                # Redis-backed Asynchronous Queue System
│   │       ├── followUpQueue.ts  # Bull Queue instance for follow-ups
│   │       ├── mailQueue.ts      # Bull Queue instance for cold emails
│   │       └── processors.ts     # Queue consumers with randomized human jitter delay
│   ├── package.json
│   └── tsconfig.json
├── frontend/                     # Vite + React 18 + TypeScript SPA
│   ├── public/                   # Static assets, logos, favicon, demo files
│   ├── src/
│   │   ├── App.tsx               # Main Router setup with protected dashboard routes
│   │   ├── components/           # Reusable UI & Business components
│   │   │   ├── AppSidebar.tsx    # Responsive collapsible sidebar navigation
│   │   │   ├── BrandLogo.tsx     # Vector Outly branding
│   │   │   ├── DashboardLayout.tsx # Persistent sidebar + header wrapper
│   │   │   ├── LimitReachedModal.tsx# Global Pro upgrade trigger on 403 limits
│   │   │   ├── MiniChart.tsx     # SVG chart visualizers
│   │   │   ├── PdfViewer.tsx     # In-browser binary PDF renderer
│   │   │   ├── StatusBadge.tsx   # Color-coded badge for lead and application stages
│   │   │   └── ui/               # 30+ Shadcn/Radix UI accessible design system components
│   │   ├── hooks/                # Custom React Hooks (toast, viewport mobile check)
│   │   ├── lib/
│   │   │   ├── api.ts            # Centralized API client with auth interceptor & limit event bus
│   │   │   └── utils.ts          # Tailwind CSS class merging utilities (`cn`)
│   │   └── pages/                # Top-level Page Views
│   │       ├── Analytics.tsx     # Metrics charts, heatmaps, and funnel conversion
│   │       ├── Applications.tsx  # Kanban Job Application Tracker
│   │       ├── AtsScore.tsx      # Comprehensive Resume Audit & ATS Breakdown
│   │       ├── ColdMail.tsx      # Cold Email Lead Table, Generator, and Queue Sender
│   │       ├── JobSearch.tsx     # Multi-platform live job aggregator
│   │       ├── Landing.tsx       # Marketing landing page with interactive demos
│   │       ├── Login.tsx         # Auth forms (Email/Password + Google OAuth2)
│   │       ├── Logs.tsx          # Real-time backend system log viewer
│   │       ├── MobileHub.tsx     # Responsive categorical mobile navigation
│   │       ├── Onboarding.tsx    # User profile and career preferences setup
│   │       ├── Pricing.tsx       # Pro tier pricing & Razorpay checkout integration
│   │       ├── ResumeTailor.tsx  # AI Resume Rewrite tailored to specific JDs
│   │       ├── ResumeVault.tsx   # Multi-version resume file storage manager
│   │       └── Settings.tsx      # System integration credentials and preferences
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── vercel.json                   # Cloud deployment configuration
```

---

## 2. Tech Stack Deep Dive

### Frontend Stack
* **React 18 & TypeScript:** Strict typing across all components, API models, and UI state.
* **Vite:** Next-generation build tool and dev server featuring instantaneous HMR.
* **Tailwind CSS & `tailwind-merge` (`clsx`):** Utility-first styling with dynamic class conflict resolution.
* **Shadcn UI & Radix UI Primitives:** Headless, accessible components (Dialogs, Dropdowns, Sheets, Popovers, Accordions).
* **Framer Motion & GSAP:** Fluid micro-interactions, page transition animations, and interactive mockups.
* **TanStack React Query (v5):** Asynchronous state management, intelligent cache invalidation, and optimistic UI mutations.
* **React Router DOM (v6):** Client-side declarative routing, nested layouts, and mobile auto-redirection.
* **Lucide React:** Iconography.
* **Recharts:** Interactive analytical data charts (bar charts, area charts, heatmaps).

### Backend Stack
* **Node.js (ES Modules) & TypeScript (`tsx`):** Modern ECMAScript modules with TypeScript execution without manual build steps in development.
* **Express.js (v4.21):** Fast, unopinionated web framework for building RESTful microservices.
* **Mongoose (v9):** Object Data Modeling (ODM) library for MongoDB managing schemas, validation, and compound indexes.
* **Bull Queue (v4) & Redis:** Distributed Redis-backed FIFO queue system handling asynchronous, rate-limited email jobs.
* **Node-Cron:** Background task scheduler managing daily digests, follow-up evaluations, and keep-alive heartbeats.
* **Winston (v3):** Industrial-grade logging library outputting formatted JSON and colorized console logs.
* **Helmet & CORS:** Security headers (XSS, Clickjacking, MIME-sniffing protection) and origin isolation.

### Artificial Intelligence & Multi-LLM Fallback Architecture
* **Primary Engine:** `@google/generative-ai` (`gemini-2.5-flash`, `gemini-2.0-flash`). Integrated with **Google Search Grounding** for live web exploration (analyzing company trends on Reddit, X, and corporate portals).
* **Secondary Engine (Fallback 1):** Groq API (`llama-3.3-70b-versatile`) for sub-second inference speed.
* **Tertiary Engine (Fallback 2):** Anthropic API (`claude-3-5-sonnet-20241022`) for deep structural resume reasoning.
* **Quaternary Engine (Fallback 3):** OpenRouter API (`deepseek/deepseek-chat`).

### External APIs & Integrations
* **Razorpay:** Payment gateway managing orders and signature verification via HMAC-SHA256 for Pro subscriptions.
* **Brevo (formerly Sendinblue) & Gmail OAuth2 API:** Dual-mode transactional email dispatcher.
* **WhatsApp Web (`whatsapp-web.js` + Puppeteer) & Twilio API:** Real-time WhatsApp notifications and AI news digests.
* **Cloudinary:** Cloud asset storage for resumes and branding images.
* **RapidAPI (JSearch API):** Real-time aggregation of job postings from Naukri, Instahyre, and Wellfound.
* **Cheerio & Axios:** Fast HTML parsing and headless website crawling for company context extraction.
* **`pdf-parse` & `mammoth`:** Binary stream extraction for PDF and Word (.docx) documents.

---

## 3. Backend Deep Dive

```
                                  ┌───────────────────────────┐
                                  │   Incoming HTTP Request   │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │ Helmet + CORS + Sanitizer │
                                  └─────────────┬─────────────┘
                                                │
                          ┌─────────────────────┴─────────────────────┐
                          │                                           │
                          ▼ (Public Route)                            ▼ (Protected Route)
               ┌─────────────────────┐                     ┌─────────────────────┐
               │ /health, /auth/ping │                     │  requireAuth (JWT)  │
               └─────────────────────┘                     └──────────┬──────────┘
                                                                      │
                                                ┌─────────────────────┴─────────────────────┐
                                                ▼                                           ▼
                                    ┌───────────────────────┐                   ┌───────────────────────┐
                                    │  checkLimits (Free)   │                   │    Controller Logic   │
                                    └───────────┬───────────┘                   └───────────┬───────────┘
                                                │ (Pass)                                    │
                                                └─────────────────────┬─────────────────────┘
                                                                      │
                                                                      ▼
                                                        ┌───────────────────────────┐
                                                        │ MongoDB (Mongoose Models) │
                                                        └─────────────┬─────────────┘
                                                                      │
                                                                      ▼
                                                        ┌───────────────────────────┐
                                                        │ Bull Queues / Multi-LLMs  │
                                                        └───────────────────────────┘
```

### 3.1 Entry Point (`backend/src/index.ts`)
1. Configures environment variables via `dotenv`.
2. Validates and ensures essential writable directories exist (`data/uploads`, `data/resumes`, `logs/`).
3. Starts the Express HTTP listener immediately to guarantee sub-100ms health checks.
4. Initializes the headless `whatsapp-web.js` client in the background.
5. Establishes a persistent Mongoose connection to MongoDB.
6. Boots the background `node-cron` schedulers (`dailySummary`, `followUpChecker`, `weeklyReport`, `keepAlive`).
7. Initializes Bull Queue worker consumers (`queue/processors.ts`).

### 3.2 Express Server & Middleware Chain (`backend/src/api/server.ts`)
* `helmet()`: Hardens HTTP response headers.
* `cors()`: Enforces CORS policy matched to `env.CLIENT_ORIGIN` with credentials enabled.
* `express.json({ limit: "50mb" })` & `express.urlencoded({ limit: "50mb" })`: Handles base64 resume payloads.
* `sanitizeNoSql`: Middleware that recursively strips MongoDB operator keys (keys starting with `$` or containing `.`) from `req.body`, `req.query`, and `req.params`.
* **Instant Ping Route (`/health`, `/api/auth/ping`)**: Returns HTTP 200 immediately to prevent cold-start delays on serverless infrastructure.
* **Database Readiness Guard**: Blocks downstream requests if the MongoDB replica set/cluster is unreachable.
* **Global Error Middleware**: Intercepts unhandled errors, converts Multer file size exceptions (`LIMIT_FILE_SIZE`) into user-friendly HTTP 400 responses, and prevents internal stack trace leaks.

### 3.3 Core Middlewares
1. **`requireAuth` (`middleware/auth.ts`)**:
   - Inspects `Authorization: Bearer <token>`.
   - Verifies the signature with `env.JWT_SECRET`.
   - Attaches decoded payload `{ id, email, plan, fullName }` to `req.user`.
   - Returns HTTP 401 if token is missing, expired, or tampered with.

2. **`checkColdMailLimit`, `checkAtsLimit`, `checkTailorLimit` (`middleware/limits.ts`)**:
   - Checks if `req.user.plan === 'pro'`. If Pro, execution immediately continues (`next()`).
   - If Free tier: Computes a rolling 12-hour window (`new Date(Date.now() - 12 * 60 * 60 * 1000)`).
   - Queries `Company` or `ActivityLog` documents created by `userId` within this window.
   - If count $\ge 3$, computes the unlock timestamp ($T_{\text{oldest}} + 12\text{h}$) and halts with `HTTP 403 Forbidden`:
     ```json
     {
       "error": "Resume check limit reached.",
       "code": "LIMIT_ATS_EXCEEDED",
       "message": "Free tier is limited to 3 ATS checks per 12 hours. Please upgrade to Pro for unlimited checks.",
       "unlockAt": "2026-09-02T12:00:00.000Z"
     }
     ```

3. **`uploadResume` & `uploadCSV` (`middleware/upload.ts`)**:
   - Configures Multer storage to write incoming files into `data/uploads/`.
   - Limits file size to 5 MB.
   - Enforces MIME-type filtering allowing only `.pdf`, `.docx`, `.txt`, and `.csv`.

---

### 3.4 Complete REST API Endpoints

| Category | Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/health`, `/api/auth/ping` | No | Instant health & DB status check |
| **Auth** | `POST` | `/api/auth/signup` | No | Create user, hash password (bcrypt), trigger welcome email, return JWT |
| | `POST` | `/api/auth/login` | No | Verify credentials, return signed JWT |
| | `POST` | `/api/auth/google` | No | Verify Google ID token/Access token, auto-provision user, return JWT |
| | `GET` | `/api/auth/me` | Yes | Get authenticated user profile & current plan tier |
| | `POST` | `/api/auth/upgrade` | Yes | Direct plan tier mutation (`free` $\to$ `pro`) |
| | `GET` | `/api/auth/gmail/url` | Yes | Generate OAuth2 authorization consent URL for Gmail API |
| | `GET` | `/api/auth/gmail/callback`| No | Gmail OAuth2 redirect callback receiver returning refresh token |
| **ATS & Resume** | `POST` | `/api/ats/parse-file` | Yes | Parse binary `.pdf`/`.docx`/`.txt` to plain text string |
| | `POST` | `/api/ats/score` | Yes | Score resume against JD (or general audit) with Gemini/Groq/Claude |
| | `POST` | `/api/ats/tailor` | Yes | Tailor resume to JD with real-time Google Search grounding |
| **Resume Vault** | `GET` | `/api/resume` | Yes | List all stored resumes for current user |
| | `POST` | `/api/resume/upload` | Yes | Upload, parse, store base64 binary & sync to Cloudinary |
| | `GET` | `/api/resume/:id` | Yes | Retrieve metadata and plain text of a specific resume |
| | `GET` | `/api/resume/:id/file` | Yes | Binary stream download of the original file (Disk $\to$ Base64 DB $\to$ Cloudinary) |
| | `POST` | `/api/resume/:id/default`| Yes| Set resume as user's primary default |
| | `PUT` | `/api/resume/:id` | Yes | Update resume label or metadata |
| | `DELETE`| `/api/resume/:id` | Yes | Delete resume from database and filesystem |
| **Cold Outreach** | `GET` | `/api/coldmail/companies` | Yes | Fetch all scraped/targeted companies for user |
| | `POST` | `/api/coldmail/companies` | Yes | Insert new target company & trigger background AI draft generator |
| | `POST` | `/api/coldmail/upload-csv`| Yes | Bulk import target leads from CSV |
| | `POST` | `/api/coldmail/scrape/:id`| Yes | Trigger web crawl, tech stack detection, and news extraction |
| | `POST` | `/api/coldmail/generate/:id`| Yes| Generate 3 email variants (Formal, Casual, Short) + 2 follow-ups |
| | `POST` | `/api/coldmail/approve/:id`| Yes | Mark company email draft as approved |
| | `POST` | `/api/coldmail/send-approved`| Yes| Enqueue all approved emails into Bull Redis Queue |
| | `POST` | `/api/coldmail/create-gmail-draft/:id`| Yes| Create an authentic draft inside user's Gmail mailbox via Gmail API |
| | `DELETE`| `/api/coldmail/companies/:id`| Yes| Delete target company lead |
| **Job Tracker** | `GET` | `/api/applications` | Yes | Get all tracked job applications across all stages |
| | `POST` | `/api/applications` | Yes | Create a new tracked application |
| | `PUT` | `/api/applications/:id`| Yes | Update application stage (`saved`, `applied`, `interview`, `offer`, `rejected`) |
| | `DELETE`| `/api/applications/:id`| Yes | Remove tracked application |
| **Job Scraper** | `POST` | `/api/scraper/jobs` | Yes | Live search on Naukri, Instahyre, Wellfound via JSearch RapidAPI |
| **Analytics** | `GET` | `/api/analytics` | Yes | Compute open rates, reply rates, average response lag, heatmap |
| **Dashboard** | `GET` | `/api/dashboard/stats` | Yes | Aggregate stats (sent count, replies, tracker stages) |
| | `GET` | `/api/dashboard/activity`| Yes| Fetch recent activity log feed |
| | `GET` | `/api/dashboard/system-status`| Yes| Verify health of Redis, Brevo/Gmail, and WhatsApp Web |
| **Billing** | `POST` | `/api/create-order` | No | Create Razorpay order (`amount`, `currency`) |
| | `POST` | `/api/verify-payment` | Yes | Verify Razorpay HMAC-SHA256 signature and auto-upgrade user |
| **WhatsApp** | `GET` | `/api/whatsapp/status` | Yes | Get WhatsApp Web connection state and QR base64 code |
| | `POST` | `/api/whatsapp/test` | Yes | Send test WhatsApp message to user's registered phone |

---

## 4. Important Code Explanations & Critical Logic Patterns

### 4.1 Multi-LLM Cascading Fallback Pattern
In production, LLM APIs can suffer from rate limits (HTTP 429), server overload (HTTP 503), or safety filter blocks. Outly implements a **fail-safe multi-tier cascading fallback mechanism**:

```typescript
// 1. Try Gemini with Real-Time Google Search Grounding
try {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} }]
  });
  const res = await model.generateContent(promptWithTags);
  return parseGeminiResponse(res.response.text());
} catch (geminiError) {
  // 2. Try Gemini without Search Grounding (in case Tool Calling failed)
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const res = await model.generateContent(fallbackJsonPrompt);
    return JSON.parse(res.response.text());
  } catch (geminiBasicError) {
    // 3. Fallback to Groq Llama 3.3 70B (High speed, open weights)
    if (env.GROK_API_KEY) {
      try {
        return await scoreWithGroq(resume, jd, env.GROK_API_KEY);
      } catch (groqError) { /* continue */ }
    }
    // 4. Fallback to Anthropic Claude 3.5 Sonnet (Deep reasoning)
    if (env.CLAUDE_API_KEY) {
      return await evaluateWithClaude(resume, jd, env.CLAUDE_API_KEY);
    }
  }
}
```

### 4.2 Razorpay HMAC-SHA256 Payment Signature Verification
Payment gateways must never be trusted on client callbacks alone. Outly cryptographically verifies the authenticity of the transaction:

```typescript
// Generated signature formula: HMAC-SHA256(order_id + "|" + payment_id, SECRET)
const generatedSignature = crypto
  .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest("hex");

if (generatedSignature !== razorpay_signature) {
  return res.status(400).json({ success: false, error: "Signature mismatch. Payment verification failed." });
}

// Payment verified -> Upgrade user to Pro in database
await User.findByIdAndUpdate(userId, {
  $set: {
    plan: "pro",
    planExpiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) // Lifetime/Long duration
  }
});
```

### 4.3 Queue Processing with Randomized Human Jitter Delay
Sending hundreds of automated emails simultaneously triggers spam filters and domain blacklisting. Outly processes emails sequentially using a Bull queue and injects **randomized delays**:

```typescript
mailQueue.process(async (job: Job<{ companyId: string }>) => {
  const { companyId } = job.data;
  const company = await companyQueries.getById(companyId);
  if (!company || company.status !== "approved") return;

  // Check daily threshold
  const sentToday = await companyQueries.countMailsSentToday(company.userId);
  if (sentToday >= env.MAX_EMAILS_PER_DAY) {
    throw new Error("Daily email limit exceeded.");
  }

  // Dispatch via Brevo or Gmail OAuth2
  const success = await sendColdMail(companyId);

  // Apply human-like delay (e.g., between 180s and 420s) before taking next job
  const delaySec = Math.floor(Math.random() * (env.MAIL_DELAY_MAX_SECONDS - env.MAIL_DELAY_MIN_SECONDS + 1)) + env.MAIL_DELAY_MIN_SECONDS;
  await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
});
```

### 4.4 DOMMatrix Polyfill for Serverless PDF Parsing
`pdf-parse` internally relies on `pdfjs-dist`, which expects browser-level DOM APIs like `DOMMatrix`. In headless Node.js or serverless environments, this can trigger fatal crashes (`DOMMatrix is not defined`). Outly handles this cleanly:

```typescript
import CSSMatrix from "dommatrix";

// Polyfill DOMMatrix globally before loading PDF modules
if (!(globalThis as any).DOMMatrix) {
  (globalThis as any).DOMMatrix = CSSMatrix;
}
```

---

## 5. Frontend Overview

```
                               ┌───────────────────────────┐
                               │   Vite + React 18 Root    │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │ React Query Provider      │
                               │ Tooltip & Toast Providers │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │    BrowserRouter Routing   │
                               └─────────────┬─────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      │                                             │
                      ▼ (Public Routes)                             ▼ (Protected Routes)
             ┌─────────────────┐                          ┌──────────────────┐
             │ /, /login       │                          │ DashboardLayout  │
             └─────────────────┘                          └─────────┬────────┘
                                                                    │
                                            ┌───────────────────────┴───────────────────────┐
                                            ▼                                               ▼
                                  ┌───────────────────┐                           ┌───────────────────┐
                                  │ Desktop Pages     │                           │ MobileHub Views   │
                                  │ (/ats-score, etc.)│                           │ (/resumes, /jobs) │
                                  └───────────────────┘                           └───────────────────┘
```

### 5.1 Route Hierarchy (`frontend/src/App.tsx`)
- **Public Routes:** `/` (Interactive Landing page), `/login` (Unified Sign-in & Sign-up).
- **Workspace Layout (`DashboardLayout`):** Includes responsive sidebar navigation, account badge, mobile sheet menu, and real-time backend health monitor.
- **Mobile Adaptive Redirection (`MobileRedirect`):** On screens $< 768\text{px}$, routes like `/ats-score` or `/cold-mail` automatically redirect to organized categorical hubs (`/resumes?tab=ats`, `/tools?tab=mail`).

### 5.2 API Communication & Custom Event Bus (`frontend/src/lib/api.ts`)
* All network calls use the unified `fetchApi<T>()` wrapper.
* Automatically reads `outly_token` from `localStorage` and appends `Authorization: Bearer <token>`.
* **Global Rate Limit Interceptor**: If the backend returns `HTTP 403` with a code starting with `LIMIT_` (e.g. `LIMIT_ATS_EXCEEDED`), `api.ts` dispatches a global window event (`outly_limit_exceeded`). The `LimitReachedModal` listens for this event anywhere in the component tree and renders an upgrade prompt without manual error handling on every page.

---

## 6. Database Schemas & Models (MongoDB / Mongoose)

```
                            ┌────────────────────────┐
                            │       User Model       │
                            │  (_id, email, plan)    │
                            └───────────┬────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │ 1:N                        │ 1:N                        │ 1:N
           ▼                            ▼                            ▼
┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│     Company Model     │    │   Application Model   │    │   ResumeVault Model   │
│  (userId, status,     │    │  (userId, company,    │    │  (userId, filename,   │
│   generated_mail)     │    │   stage, notes)       │    │   fileData, is_def)   │
└───────────────────────┘    └───────────────────────┘    └───────────────────────┘
```

### 6.1 Data Models Overview

1. **`User`**:
   - `email` (String, unique, indexed, required)
   - `passwordHash` (String, required)
   - `fullName` (String), `profilePic` (String)
   - `plan` (String, enum: `["free", "pro"]`, default: `"free"`)
   - `planExpiresAt` (Date), `createdAt` (Date)

2. **`Company` (Target Leads for Cold Outreach)**:
   - `userId` (ObjectId $\to$ `User`, indexed, required)
   - `company_name`, `role`, `hr_email` (String, required)
   - `website_url`, `linkedin_url`, `target_person_name`, `target_person_role`
   - `status` (String: `pending`, `scraped`, `mail_generated`, `approved`, `mail_sent`, `replied`, `bounced`, `skipped`)
   - `scraped_context` (JSON string containing tech stack, news, social links)
   - `generated_subject`, `generated_mail`, `personalization_hook`
   - `generated_variants_json` (JSON string storing Formal, Casual, Short versions)
   - `sent_at`, `reply_detected_at`, `followup_sent_at`, `followup_status`

3. **`Application` (Job Application Kanban Tracker)**:
   - `userId` (ObjectId $\to$ `User`, indexed, required)
   - `company`, `role` (String, required)
   - `jd_url` (String)
   - `stage` (String, enum: `["saved", "applied", "interview", "offer", "rejected"]`, default: `"saved"`)
   - `resume_version_used` (String)
   - `notes` (String), `email_history` (JSON array string)

4. **`ResumeVault`**:
   - `userId` (ObjectId $\to$ `User`, indexed, required)
   - `filename`, `label` (String, required)
   - `content` (Extracted plain text)
   - `fileData` (Base64 string representing raw binary file; marked `{ select: false }` for performance)
   - `mimeType` (String), `is_default` (Number: 0 or 1), `cloudinaryUrl` (String)

5. **`Setting` (User Preferences Key-Value)**:
   - `userId` (ObjectId $\to$ `User`, required)
   - `key` (String, required), `value` (String)
   - *Index:* Compound unique index `{ userId: 1, key: 1 }` ensuring isolated settings per user.

6. **`ActivityLog`**:
   - `userId` (ObjectId $\to$ `User`, indexed, required)
   - `type` (String: `ats_check`, `ats_tailor`, `mail_sent`, `job_search`, etc.)
   - `message` (String), `meta` (String), `createdAt` (Date)

---

## 7. Authentication Flow (Step-by-Step)

```
[User Signup / Login] ──► [Hash Check / OAuth Exchange] ──► [Generate Signed JWT] ──► [Stored in LocalStorage]
                                                                                              │
                                                                                              ▼
[Protected API Request] ◄── [req.user Attached] ◄── [Verify Signature] ◄── [Header: Bearer <token>]
```

### 7.1 Signup Flow
1. Client sends `POST /api/auth/signup` with `{ email, password, fullName }`.
2. Backend normalizes email (`email.toLowerCase().trim()`) and checks for existing user in MongoDB.
3. Password is salt-hashed using `bcrypt.hash(password, 10)`.
4. User record is created with default `plan: "free"`.
5. An automated welcome email is dispatched asynchronously in the background.
6. A JWT is signed containing `{ id, email, plan, fullName }` with 7-day expiration (`expiresIn: "7d"`).
7. Returns HTTP 201 with `{ token, user }`.

### 7.2 Traditional Login Flow
1. Client sends `POST /api/auth/login` with `{ email, password }`.
2. Backend finds user by normalized email. Returns HTTP 401 if user not found.
3. Compares candidate password with stored hash via `bcrypt.compare(password, user.passwordHash)`.
4. On match, issues signed JWT with current plan status.

### 7.3 Google OAuth2 Flow
1. Client initiates Google Sign-In and obtains either an OAuth `access_token` or OpenID `credential` (ID token).
2. Client sends `POST /api/auth/google`.
3. Backend verifies the token against Google's token verification endpoints (`https://openidconnect.googleapis.com/v1/userinfo` or `https://oauth2.googleapis.com/tokeninfo`).
4. Extracts verified `email`, `name`, and avatar `picture`.
5. Finds existing user or automatically provisions a new account with a cryptographically secure random password hash (`crypto.randomBytes(32)`).
6. Issues signed JWT.

---

## 8. Key Features of Outly

1. **AI Resume Auditor & ATS Match Analyzer (`/ats-score`)**:
   - Parses multi-page `.pdf`, `.docx`, and `.txt` files.
   - Heuristic validation detects non-resume uploads (invoices, certificates, tax forms) before burning LLM tokens.
   - Evaluates resume against target Job Description across 4 metrics: Skills Match, Experience Alignment, Format Readability, and Quantifiable Impact Metrics.
   - Outputs keyword gaps categorized into Hard Skills, Soft Skills, and Tools/Technologies.

2. **Grounded AI Resume Tailor (`/resume-tailor`)**:
   - Rewrites bullet points to highlight skills from the target JD.
   - Uses **Google Search Grounding** to search discussions on Reddit, Twitter/X, and company portals to include relevant industry terminology without fabricating work history.

3. **Autonomous Cold Email Outreach Engine (`/cold-mail`)**:
   - Scrapes company domain and resolves social media profiles, public news articles, and technology signals.
   - Generates 3 customizable email variants (Formal, Casual, Short) and 2 follow-up sequences.
   - Dispatches emails through Brevo or user's connected Gmail OAuth2 account with randomized human-like delay intervals.

4. **Automated Follow-Up Cron Checker**:
   - `node-cron` evaluates emails sent $> 5$ days ago with no reply detected.
   - Automatically drafts context-aware follow-up reminders and pushes them to the queue.

5. **Multi-Platform Live Job Aggregator (`/job-search`)**:
   - Queries Naukri, Instahyre, and Wellfound via JSearch RapidAPI.
   - Deduplicates listings and formats compensation, experience requirements, and location tags.

6. **Visual Kanban Application Tracker (`/applications`)**:
   - Drag-and-drop / stage-based tracker (`Saved` $\to$ `Applied` $\to$ `Interview` $\to$ `Offer` $\to$ `Rejected`).
   - Keeps history of resume versions used and interview notes.

---

## 9. Interview Ready Points & Potential Q&A

### Architecture Decision Highlights
* **Why MongoDB with Mongoose?**  
  *Unstructured & Polymorphic Payloads:* Cold email variants, AI JSON breakdowns, scraped website contexts, and social signals differ drastically across companies. MongoDB's flexible schema handles evolving JSON payloads without expensive schema migrations.
* **Why Bull Queue & Redis instead of immediate async functions?**  
  *Fault Tolerance & Rate Limiting:* Direct asynchronous loops in Express memory will crash if the server restarts and cannot enforce distributed rate limits or persistent retries. Bull ensures durability and sequential processing.
* **Why Multi-LLM Cascading Fallback?**  
  *High Availability:* Gemini offers free/cost-effective search grounding, but free-tier quotas can be strict. Having Groq (Llama 3.3) and Anthropic (Claude 3.5) fallbacks guarantees 99.9% uptime for critical resume operations.

---

### Potential Technical Interview Questions & Answers

#### Q1: How do you handle NoSQL Injection attacks in an Express + MongoDB application?
> **Answer:**  
> Attackers can send JSON payloads containing MongoDB query operators like `{"$gt": ""}` to bypass authentication. Outly uses a custom `sanitizeNoSql` middleware that recursively scans `req.body`, `req.query`, and `req.params`, stripping any object keys containing dots (`.`) or prefixing with `$` before requests hit the database queries.

#### Q2: How did you implement tier-based rate limiting (Free vs. Pro) without Redis on basic routes?
> **Answer:**  
> For Free tier users, Outly implements a **rolling 12-hour sliding window rate limiter** in Mongoose (`middleware/limits.ts`). It queries the `ActivityLog` or `Company` collections for actions matching the user's ID with `createdAt >= (Now - 12 hours)`. If the count is $\ge 3$, it rejects the request with HTTP 403 and returns the exact unlock timestamp ($T_{\text{oldest}} + 12\text{h}$). Pro users bypass this check entirely based on the `plan` field verified in their JWT.

#### Q3: Why does Outly store resume files both on disk, as base64 in MongoDB, and on Cloudinary?
> **Answer:**  
> This multi-tier storage design ensures high availability across environments:
> 1. **Local Disk (`data/resumes/`):** Fast binary downloads for local development and dedicated server setups.
> 2. **MongoDB Base64 (`fileData`):** Guarantees zero-data-loss durability on serverless cloud platforms (where filesystem writes to `/tmp` are ephemeral). The field is marked `{ select: false }` to avoid memory overhead during standard queries.
> 3. **Cloudinary (`cloudinaryUrl`):** Enables global CDN delivery and instant previewing in web browsers.

#### Q4: How is payment verification secured against tampering in Razorpay?
> **Answer:**  
> Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` upon client checkout completion. The server computes a cryptographic hash: `HMAC-SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)` and performs a strict string comparison with the signature provided. Only when the hashes match does the server upgrade the user's plan to `pro`.

---

## 10. How to Run the Project Locally

### Prerequisites
- Node.js (v18.x or higher)
- MongoDB running locally (`mongodb://localhost:27017/outly`) or MongoDB Atlas URI
- Redis running locally (`redis://localhost:6379`) or Redis Cloud URI

---

### Backend Setup

1. Open terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file in `backend/`:
   ```env
   PORT=3001
   CLIENT_PORT=3000
   CLIENT_ORIGIN=http://localhost:3000
   NODE_ENV=development

   # Database & Security
   MONGODB_URI=mongodb://localhost:27017/outly
   JWT_SECRET=your_jwt_secret_key_change_in_production
   REDIS_URL=redis://localhost:6379

   # AI LLM Keys
   GEMINI_API_KEY=your_gemini_api_key
   GROK_API_KEY=your_groq_api_key
   CLAUDE_API_KEY=your_anthropic_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key

   # Email Service (Brevo or Gmail OAuth2)
   BREVO_API_KEY=your_brevo_api_key
   GMAIL_CLIENT_ID=your_gmail_client_id
   GMAIL_CLIENT_SECRET=your_gmail_client_secret
   GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
   GMAIL_USER=your_email@gmail.com

   # Payment Gateway
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   # Scraper & News APIs
   RAPIDAPI_KEY=your_rapidapi_jsearch_key
   NEWS_API_KEY=your_news_api_key

   # WhatsApp / Twilio
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

   # Cloud Storage
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

---

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file in `frontend/`:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```
4. Start Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`.
