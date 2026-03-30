# Outly 🚀 | AI-Powered Job Hunt Automation

**Outly automates your entire job search.**  
It performs deep company research using AI, generates hyper-personalized cold emails, tailors your resume to match job descriptions, and intelligently schedules LinkedIn & Twitter posts.

---

### ✨ Key Features

- **AI Cold Email Generator** — Upload a CSV of company names → GPT-4 researches each company and writes unique, highly personalized cold emails.
- **Auto-Save to Gmail** — All emails are automatically saved as drafts in your Gmail using Gmail API + OAuth 2.0.
- **AI Resume-to-JD Matcher** — GPT-4 analyzes your resume against a Job Description, scores compatibility, highlights missing ATS keywords, and gives improvement suggestions.
- **Fault-Tolerant Job Queue** — Built with Bull + Redis for rate-limiting, auto-retry, and reliable execution even at scale.
- **AI Content Scheduler** — Generates smart LinkedIn & Twitter posts using GPT-4 and schedules them via Telegram Bot.
- **Production-Ready Architecture** — Clean code, proper error handling, and scalable design.

---

### 🛠️ Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js + Express.js
- **AI**: GPT-4 (OpenAI)
- **Queue & Cache**: Bull Queue + Redis
- **APIs**: Gmail API, OAuth 2.0, Telegram Bot API
- **Others**: TypeScript, JWT

---

### 📁 Project Structure
Outly/
├── backend/          # Node.js + Express + Bull + Redis + APIs
├── frontend/         # React.js Dashboard
├── .env.example
├── .gitignore
└── README.md
text---

### 🚀 Quick Start

1. Clone the repository
   ```bash
   git clone https://github.com/bharatdhuva/Outly.git
   cd Outly

Backend SetupBashcd backend
npm install
cp .env.example .env
# Add your API keys in .env
npm run dev
Frontend Setup (in a new terminal)Bashcd frontend
npm install
npm run dev<img width="1920" height="1080" alt="Screenshot (1217)" src="https://github.com/user-attachments/assets/bc8517e4-28e2-445c-9449-374b6162a6f5" />
<img width="1920" height="1080" alt="Screenshot (1218)" src="https://github.com/user-attachments/assets/b0ed4b66-1bfd-4c91-b74c-897f180b434f" />
<img width="1920" height="1080" alt="Screenshot (1219)" src="https://github.com/user-attachments/assets/7f8282a5-6695-4040-84ca-6598f2ff72d9" />
<img width="1920" height="1080" alt="Screenshot (1220)" src="https://github.com/user-attachments/assets/5b8a5e0b-8253-41c0-9400-28ceb18ad4d4" />
<img width="1920" height="1080" alt="Screenshot (1221)" src="https://github.com/user-attachments/assets/a185ee89-83af-4cf6-a918-d81a6f870abd" />
<img width="1920" height="1080" alt="Screenshot (1222)" src="https://github.com/user-attachments/assets/44e64ec1-45f9-4590-80d8-35de33f48da3" />
<img width="1920" height="1080" alt="Screenshot (1223)" src="https://github.com/user-attachments/assets/b802e226-2da6-46ac-842d-f437a4263f35" />
<img width="1920" height="1080" alt="Screenshot (1224)" src="https://github.com/user-attachments/assets/209b38a7-2f62-4e8a-8f67-5563fd6c02e4" />
<img width="1920" height="1080" alt="Screenshot (1225)" src="https://github.com/user-attachments/assets/af7e377e-d416-4746-a013-38d3d1306283" />
<img width="1920" height="1080" alt="Screenshot (1226)" src="https://github.com/user-attachments/assets/ccd76ba5-084d-44e6-b2e1-7853657ba73a" />
