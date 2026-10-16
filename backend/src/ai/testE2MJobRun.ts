/**
 * E2M Solutions - AI Engineer Internship End-to-End Test Runner
 *
 * Demonstrates the 4 core LangChain features configured specifically for
 * the provided Job Description:
 * - Company: E2M Solutions
 * - Title: AI Intern / AI Engineer Internship (Ahmedabad)
 * - Scope: LLM APIs, LangChain, RAG, Embeddings, Document Automation, Resume/JD Matching
 */

import { generateColdEmailChain } from "./coldMailChain.js";
import { matchResumeToJd } from "./resumeJdMatcher.js";
import { scoreResumeChain } from "./atsScoreChain.js";
import { tailorResumeChain } from "./resumeTailorChain.js";

export const E2M_JOB_DESCRIPTION = `
Company: E2M Solutions
Title: AI Intern / AI Engineer Internship
Duration: 6 months
Location: On-Site (Ahmedabad)
Type: Paid Internship

About Us:
E2M is a digital agency partner driven by 300+ experienced professionals helping digital agencies solve bandwidth problems and increase profitability.

Objective:
Provide students with real-world experience building practical AI products using LLM APIs, frontend, backend, databases, and automation logic, with an opportunity to join full-time upon successful completion.

What You'll Work On:
- Build AI-powered micro apps for internal teams and clients.
- Create custom dashboards and internal productivity tools.
- Develop AI-native applications using LLM APIs (OpenAI, Claude, Gemini).
- Work on document automation, proposal generation, report generation, resume/JD matching, and meeting summary tools.
- Assist in building AI agents, RAG flows, vector search, and document-based AI assistants.
- Build simple full-stack AI applications across frontend, backend, APIs, databases, and AI models.
- Convert business requirements into working prototypes and MVPs quickly using modern AI tools.
- Test AI outputs, debug flows, and improve accuracy, formatting, and edge-case handling.

Technical Skills:
- Programming: Python, Node.js / TypeScript.
- Backend: REST APIs, server logic (Node.js, Express, FastAPI).
- Frontend: HTML, CSS, JavaScript, React / Next.js / Streamlit.
- Databases: Understanding databases and CRUD operations (MongoDB, PostgreSQL, Supabase).
- AI/LLM APIs: Experience integrating LLM APIs (OpenAI, Claude, Gemini).
- Bonus / Nice to Have: Exposure to LangChain, LangGraph, RAG, embeddings, vector databases, or AI agents. Prompt engineering and structured AI outputs.
`;

export const SAMPLE_CANDIDATE_RESUME = `
Bharat Dhuva
Full-Stack & AI Engineer | Ahmedabad, India | github.com/bharatdhuva

SUMMARY:
Passionate Full-Stack & Applied AI Engineer pursuing a degree in Computer Science. Proven experience designing and deploying AI-native web applications, REST APIs, and automated workflows using TypeScript, Node.js, Express, React, and Google Gemini / LLM APIs. Strong foundation in databases, vector embeddings, and LangChain orchestration.

TECHNICAL SKILLS:
- Languages & Frameworks: TypeScript, JavaScript, Python, Node.js, Express.js, React, Next.js, HTML5, CSS3, Tailwind CSS
- AI & LLM Tooling: LangChain, Google Gemini API, OpenAI API, Anthropic Claude API, Vector Embeddings, Prompt Engineering, Structured JSON Outputs
- Databases & Queues: MongoDB (Mongoose), PostgreSQL, Redis, Bull Queue
- Tools & DevOps: Git, GitHub, Playwright, RESTful APIs, Cloudinary, Linux

EXPERIENCE & PROJECTS:
Outly — AI-Powered Personal Career Automation Platform
Full-Stack AI Developer
- Engineered an end-to-end career automation platform integrating Google Gemini and LangChain LCEL runnable sequences.
- Built a multi-tenant backend in Node.js/Express with MongoDB and Redis queues supporting automated cold email generation, ATS scoring, and resume tailoring.
- Implemented semantic Resume-to-JD matching utilizing Google Generative AI embeddings and mathematical cosine similarity.
- Developed dynamic React 18 dashboard with responsive Tailwind CSS interface.

Document Intelligence & Automation Micro-App
Applied AI Developer
- Built automated document parsing and structured extraction pipeline using LLMs and Node.js.
- Implemented RAG-based search and validation rules reducing manual document review times by 60%.
`;

export async function runE2MDemonstration() {
  console.log("=================================================================");
  console.log("🤖 RUNNING LANGCHAIN AI PIPELINE FOR E2M SOLUTIONS AI INTERNSHIP");
  console.log("=================================================================\n");

  // 1. COLD EMAIL CHAIN
  console.log("--- 1. Testing Cold Mail Writer Chain (with A/B Variants) ---");
  const emailResult = await generateColdEmailChain({
    companyName: "E2M Solutions",
    targetRole: "AI Intern",
    websiteUrl: "https://www.e2msolutions.com",
    targetPerson: "AI Team Lead / Hiring Manager",
    targetPersonRole: "Head of AI Practice",
    keySkills: "React, Node.js, LangChain, RAG, Gemini API, Vector Embeddings",
    experienceLevel: "Pursuing CS Degree / Full-Stack & AI Projects",
    senderName: "Bharat Dhuva",
    senderLocation: "Ahmedabad, India",
    personalizationHook: "Excited by E2M's hands-on work building AI micro-apps and document automation tools for digital agencies.",
    resumeSummary: SAMPLE_CANDIDATE_RESUME,
  });

  console.log("Primary Subject:", emailResult.subject);
  console.log("Primary Body:\n", emailResult.body);
  console.log("\nGenerated A/B Testing Variants:", emailResult.variants.length);
  emailResult.variants.forEach((v) => {
    console.log(`[${v.variant_name}] Subject: "${v.subject}"`);
  });

  // 2. RESUME -> JD MATCHER
  console.log("\n--- 2. Testing Resume -> JD Matcher (Embeddings + Cosine Similarity) ---");
  const matchResult = await matchResumeToJd({
    resumeText: SAMPLE_CANDIDATE_RESUME,
    jobDescription: E2M_JOB_DESCRIPTION,
  });

  console.log(`Overall Match Score: ${matchResult.matchScore}/100`);
  console.log(`Vector Embedding Cosine Similarity: ${matchResult.embeddingSimilarity}%`);
  console.log("Matched Skills:", matchResult.matchedSkills);
  console.log("Missing Skills:", matchResult.missingSkills);
  console.log("Recommendations:", matchResult.recommendations);

  // 3. ATS RESUME SCORING
  console.log("\n--- 3. Testing ATS Resume Scoring Chain ---");
  const atsResult = await scoreResumeChain({
    resume: SAMPLE_CANDIDATE_RESUME,
    jd: E2M_JOB_DESCRIPTION,
  });

  console.log(`ATS Score: ${atsResult.score}/100 (Valid: ${atsResult.isValidResume})`);
  console.log("Breakdown:", atsResult.breakdown);
  console.log("Matched Keywords:", atsResult.matched_keywords);
  console.log("Missing Hard Skills:", atsResult.missing_keywords.hard_skills);
  console.log("ATS Suggestions:", atsResult.suggestions);

  // 4. RESUME TAILOR ENGINE
  console.log("\n--- 4. Testing Resume Tailor Engine (Section-Wise) ---");
  const tailorResult = await tailorResumeChain({
    resume: SAMPLE_CANDIDATE_RESUME,
    jd: E2M_JOB_DESCRIPTION,
  });

  console.log("Tailored Summary:\n", tailorResult.sections.summary);
  console.log("Tailored Highlighted Skills:", tailorResult.sections.skills);
  console.log("Modifications Summary:", tailorResult.modificationsSummary);
  console.log("\n=================================================================");
  console.log("✅ ALL 4 LANGCHAIN AI FEATURES COMPLETED SUCCESSFULLY FOR E2M JD!");
  console.log("=================================================================");

  return { emailResult, matchResult, atsResult, tailorResult };
}

// Allow direct execution via CLI
if (process.argv[1] && process.argv[1].endsWith("testE2MJobRun.ts")) {
  runE2MDemonstration().catch(console.error);
}
