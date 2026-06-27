<div align="center">

<h1>Outly 🚀</h1>
<h3>AI-Powered Personal Career Automation System</h3>
<p><em>Stop applying manually. Let AI automate your outreach, tailoring, and job tracking.</em></p>

[![Status](https://img.shields.io/badge/status-Active-brightgreen?style=flat-square)](https://outly.online)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20TS-6366f1?style=flat-square)](https://outly.online)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20TS-green?style=flat-square)](https://github.com/bharatdhuva/Outly)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%2B%20SQLite-orange?style=flat-square)](https://github.com/bharatdhuva/Outly)

</div>

---

## 🌟 What is Outly?

Job hunting can be repetitive and exhausting: writing dozens of cold emails, customizing resumes for every job description, and manually tracking application statuses.

**Outly automates your career search so you don't have to.**

Outly provides a unified suite for job seekers — featuring personalized AI recruiter outreach, instant ATS resume scoring, automated resume tailoring, visual Kanban job tracking, and daily morning career briefs.

---

## ✨ Core Features

| Feature | Description |
|---------|-------------|
| 🌅 **The Daily Brief** | A morning overview summarizing application progress, interview schedules, and new job matches in seconds. |
| 📧 **AI Recruiter Outreach** | Upload outreach targets → AI analyzes company details → generates personalized cold email drafts in your voice. |
| 📄 **Resume Vault & ATS Matcher** | Auto-scores resumes against job descriptions, highlights missing ATS keywords, and exports tailored PDFs. |
| 📋 **Visual Job Application Tracker** | Interactive Kanban board to drag, drop, and manage applications across *Applied*, *Interviewing*, and *Offers*. |
| 🔍 **AI Job Search Engine** | Discover matching job opportunities tuned to your profile and track them directly into your pipeline. |
| 📅 **Social Content Scheduler** | AI-assisted generation and scheduling for LinkedIn & Twitter career updates. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React (TypeScript), Vite, TailwindCSS, Shadcn UI, Lucide Icons, GSAP, Recharts |
| **Backend** | Node.js (TypeScript), Express.js, TypeScript Compiler (`tsc`) |
| **Databases** | MongoDB (Mongoose) + SQLite (`better-sqlite3`) |
| **Deployment** | Vercel (Frontend CDN) + Render (Cloud Backend API) |

---

## 📁 Project Structure

```
Outly/
├── backend/                  # Express TypeScript Backend API
│   ├── src/
│   │   ├── api/routes/       # REST API endpoints (Auth, Resumes, Applications, etc.)
│   │   ├── db/               # Database schemas and queries (MongoDB & SQLite)
│   │   ├── services/         # AI engines, Emailers & Notification services
│   │   └── index.ts          # Backend entry point
│   └── package.json
├── frontend/                 # Vite React TypeScript Frontend
│   ├── src/
│   │   ├── components/       # UI components & Dashboard layouts
│   │   ├── pages/            # Landing, Login, Overview, ResumeVault, Pricing
│   │   └── index.css         # Global styles & Design tokens
│   ├── vercel.json           # Frontend SPA rewrite routing
│   └── package.json
├── vercel.json               # Root monorepo Vercel build configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### Local Setup

**1. Clone the repository**
```bash
git clone https://github.com/bharatdhuva/Outly.git
cd Outly
```

**2. Backend Setup**
```bash
cd backend
npm install
npm run dev
```

**3. Frontend Setup** *(in a new terminal)*
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) (or Vite's active local port) to view the application.

---

## 🗺️ Roadmap & Progress

- [x] AI Cold Email Generation & Outreach Drafts
- [x] AI Resume-to-JD Matcher & Keyword Scoring
- [x] Resume Vault & Tailored PDF Generator
- [x] Interactive Job Application Tracker (Kanban Board)
- [x] Daily Morning Briefing System
- [x] Mobile Responsive UI & Modern Design System
- [x] Vercel & Render Full-Stack Production Deployment
- [ ] Automated Recruiter Follow-up Sequences
- [ ] Chrome Extension for One-Click Application Saving

---

<div align="center">

Built with ❤️ by **[Bharat Dhuva](https://github.com/bharatdhuva)**

[![GitHub](https://img.shields.io/badge/GitHub-bharatdhuva-181717?style=flat-square&logo=github)](https://github.com/bharatdhuva)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-bharatdhuva27-0077B5?style=flat-square&logo=linkedin)](https://linkedin.com/in/bharatdhuva27)

---

*If Outly helped your job search — drop a ⭐ on GitHub!*

</div>
