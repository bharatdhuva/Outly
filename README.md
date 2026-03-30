<div align="center">

<h1>Outly 🚀</h1>
<h3>AI-Powered Job Hunt Automation</h3>
<p><em>Stop applying manually. Let AI do the heavy lifting.</em></p>

[![GitHub stars](https://img.shields.io/github/stars/bharatdhuva/Outly?style=flat-square&color=6366f1)](https://github.com/bharatdhuva/Outly/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square&color=6366f1)](LICENSE)
[![Status](https://img.shields.io/badge/status-Active-brightgreen?style=flat-square)](https://github.com/bharatdhuva/Outly)
[![Made with](https://img.shields.io/badge/Made%20with-Node.js%20%2B%20GPT--4-6366f1?style=flat-square)](https://github.com/bharatdhuva/Outly)

</div>

---

## What is Outly?

Job hunting is broken.

You spend hours writing the same email to 50 companies. You forget to post on LinkedIn for weeks. You send the same generic resume to every job description and wonder why no one replies.

**Outly fixes all of that.**

Upload a CSV → GPT-4 researches every company → writes hyper-personalized cold emails → saves them directly to your Gmail drafts. It also matches your resume to any Job Description, scores it, and suggests exact fixes. Plus, it generates and schedules smart LinkedIn & Twitter posts automatically.

**Your job search. On autopilot.**

---

## ✨ Features

| Feature | What it does |
|---------|-------------|
| 📧 **AI Cold Email Generator** | Upload CSV → GPT-4 researches each company → writes unique personalized email → saved to Gmail Drafts |
| 📄 **AI Resume-to-JD Matcher(upcoming)** | GPT-4 scores your resume vs any JD, highlights missing ATS keywords, gives exact fixes |
| 📅 **AI Content Scheduler** | GPT-4 writes LinkedIn + Twitter posts, auto-publishes at your set time via Telegram Bot |
| ⚡ **Fault-Tolerant Job Queue** | Bull + Redis with rate-limiting, auto-retry, zero duplicate actions |
| 🔔 **Real-Time Notifications** | Instant Telegram alerts for every action — email saved, post published, match scored |
| 🔐 **Gmail OAuth Integration** | Securely connects to your Gmail — no password needed, just one-click OAuth |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js |
| **Backend** | Node.js + Express.js |
| **AI** | GPT-4 (OpenAI) |
| **Queue & Cache** | Bull Queue + Redis |
| **APIs** | Gmail API, OAuth 2.0, Telegram Bot API |
| **Auth** | JWT |

---

## 📸 Screenshots

<details>
<summary>📂 Click to view screenshots</summary>

<br>

**Loading Screen**
![Dashboard Overview](https://github.com/user-attachments/assets/bc8517e4-28e2-445c-9449-374b6162a6f5)

**Welcome Page**
![Cold Email Generator](https://github.com/user-attachments/assets/b0ed4b66-1bfd-4c91-b74c-897f180b434f)

**Home-Page**
![Resume Matcher](https://github.com/user-attachments/assets/7f8282a5-6695-4040-84ca-6598f2ff72d9)

**Cold-Mailing Page**
![Content Scheduler](https://github.com/user-attachments/assets/5b8a5e0b-8253-41c0-9400-28ceb18ad4d4)

![Telegram Bot](https://github.com/user-attachments/assets/44e64ec1-45f9-4590-80d8-35de33f48da3)


![Queue Monitor](https://github.com/user-attachments/assets/b802e226-2da6-46ac-842d-f437a4263f35)


![Settings](https://github.com/user-attachments/assets/209b38a7-2f62-4e8a-8f67-5563fd6c02e4)

</details>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Redis (local or via Docker)
- OpenAI API key
- Gmail OAuth credentials
- Telegram Bot token

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/bharatdhuva/Outly.git
cd Outly
```

**2. Backend setup**

```bash
cd backend
npm install
cp .env.example .env
# Add your API keys in .env
npm run dev
```

**3. Frontend setup** *(open a new terminal)*

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're ready to go.

---

## 🔑 Environment Variables

```env
# OpenAI
OPENAI_API_KEY=

# Gmail OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Redis
REDIS_URL=

# Telegram
TELEGRAM_BOT_TOKEN=

# JWT
JWT_SECRET=
```

---

## 📁 Project Structure

```
Outly/
├── backend/
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # AI, Gmail, Telegram logic
│   │   ├── jobs/          # Bull queue workers
│   │   └── index.js       # Entry point
├── frontend/
│   ├── src/
│   │   ├── pages/         # Dashboard pages
│   │   ├── components/    # UI components
│   │   └── App.jsx
├── .env.example
├── .gitignore
└── README.md
```

---

## 🗺️ Roadmap

- [x] AI Cold Email Generation + Gmail Drafts
- [x] AI Resume-to-JD Matcher
- [x] LinkedIn & Twitter Content Scheduler
- [x] Telegram Bot Notifications
- [x] Bull + Redis Fault-Tolerant Job Queue
- [ ] Application Tracker (Kanban Board)
- [ ] Auto Follow-up Emails (3-day delay)
- [ ] Multi-user SaaS Mode
- [ ] Chrome Extension

---

## 💡 Why I Built This

I was tired of spending hours on copy-paste job applications that felt generic and forgettable.

Every company deserves a personalized email. Every resume should actually match the job description. And no one has time to post on LinkedIn every single day.

So I built Outly — a complete automation system that handles the boring, repetitive parts of job hunting so you can focus on what actually matters: getting replies and cracking interviews.

---

<div align="center">

Built with ❤️ by **[Bharat Dhuva](https://github.com/bharatdhuva)**

Third-year Computer Science Student · MS University Baroda, Gujarat

[![GitHub](https://img.shields.io/badge/GitHub-bharatdhuva-181717?style=flat-square&logo=github)](https://github.com/bharatdhuva)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-bharatdhuva27-0077B5?style=flat-square&logo=linkedin)](https://linkedin.com/in/bharatdhuva27)

---

*If Outly helped you or you liked it — drop a ⭐ It means a lot.*

</div>
