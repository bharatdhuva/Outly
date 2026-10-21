import React, { useState, useMemo } from "react";
import { 
  Search, 
  X, 
  Mail, 
  Globe, 
  ArrowUpRight, 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  Compass, 
  HelpCircle,
  Headset
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─── VERIFIED CONTACT CHANNELS (CONFIGURABLE IN ONE PLACE) ───
const CONTACT_CONFIG = {
  email: "bharatdhuva27@gmail.com",
  xTwitterUrl: "https://x.com/mrcrotes",
  portfolioUrl: "https://bharatdhuva.vercel.app",
};

// ─── TOPIC CATEGORIES ───
interface Topic {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOPICS: Topic[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Understanding Outly, setting up your profile, and navigating the application.",
    icon: Compass,
  },
  {
    id: "resume-tools",
    title: "Resume & Career Tools",
    description: "Resume Vault, ATS scoring, AI tailoring, and automated cold email outreach.",
    icon: FileText,
  },
  {
    id: "account-privacy",
    title: "Account & Privacy",
    description: "Profile preferences, authentication, settings, and secure data handling.",
    icon: ShieldCheck,
  },
  {
    id: "plans-billing",
    title: "Plans & Billing",
    description: "Free plan limits, Outly Pro trial features, and payment verification.",
    icon: CreditCard,
  },
];

// ─── VERIFIED FAQ ITEMS (BASED ON ACTIVE OUTLY REPOSITORY) ───
interface FaqItem {
  id: string;
  category: "getting-started" | "resume-tools" | "account-privacy" | "plans-billing";
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  // Getting Started
  {
    id: "faq-1",
    category: "getting-started",
    question: "What is Outly?",
    answer:
      "Outly is an all-in-one career automation platform designed to make your job hunt faster and more focused. It combines a central Resume Vault, real-time ATS compatibility scoring, AI resume tailoring for specific job descriptions, a multi-stage application pipeline tracker, and cold mail outreach tools.",
  },
  {
    id: "faq-2",
    category: "getting-started",
    question: "How do I get started with Outly?",
    answer:
      "Getting started takes under two minutes. First, sign in to your Outly account. Next, upload your primary resume to the Resume Vault. From there, you can run an ATS analysis to discover optimization areas, explore aggregated job listings in Job Search, or tailor your resume for a target opening.",
  },
  {
    id: "faq-3",
    category: "getting-started",
    question: "What core features are available on Outly?",
    answer:
      "Outly provides five core career modules: (1) Resume Vault for centralized document version management, (2) ATS Score checker for parsing analysis and keyword detection, (3) AI Resume Tailor to align bullet points with job postings, (4) Application Tracker for tracking pipeline stages, and (5) Cold Mail generator for recruiter outreach.",
  },

  // Resume & Career Tools
  {
    id: "faq-4",
    category: "resume-tools",
    question: "How does the ATS score analysis feature work?",
    answer:
      "The ATS Score tool parses your resume using industry-standard Applicant Tracking System criteria. It evaluates structural formatting, clear section headings, keyword alignment, quantified achievements, and bullet point clarity, providing an overall percentage score with concrete suggestions for improvement.",
  },
  {
    id: "faq-5",
    category: "resume-tools",
    question: "What is the Resume Vault and how do I use it?",
    answer:
      "Resume Vault is your central library for resume files (PDF and DOCX). You can upload multiple versions, designate an active master resume, and preview extracted content. Your active resume automatically feeds into the AI Resume Tailor and Cold Mail outreach tools.",
  },
  {
    id: "faq-6",
    category: "resume-tools",
    question: "How does the AI Resume Tailor work?",
    answer:
      "Paste any target job description alongside your active resume. The tailor analyzes requirements, identifies critical missing keywords and qualifications, and recommends specific bullet point enhancements to maximize alignment with the job without falsifying your genuine experience.",
  },
  {
    id: "faq-7",
    category: "resume-tools",
    question: "What is Cold Mail outreach automation?",
    answer:
      "The Cold Mail tool drafts customized, high-converting outreach messages and follow-up sequences for hiring managers and recruiters. You can input company data manually or import bulk candidate spreadsheets to speed up your networking pipeline.",
  },

  // Account & Privacy
  {
    id: "faq-8",
    category: "account-privacy",
    question: "How do I manage my account and career settings?",
    answer:
      "Click your avatar in the top navigation bar and select 'Settings' (or navigate to /settings). You can update your display name, target job titles, experience level, core tech stack, and personal preferences at any time.",
  },
  {
    id: "faq-9",
    category: "account-privacy",
    question: "How is my uploaded resume and personal information handled?",
    answer:
      "Your documents and profile data are processed solely to provide ATS scoring, resume tailoring, and job outreach generation for your personal account. Outly does not sell or distribute your personal documents or contact information to third-party advertisers.",
  },
  {
    id: "faq-10",
    category: "account-privacy",
    question: "What should I do if I encounter a technical issue?",
    answer:
      "If you experience an unexpected error, first check your internet connection or inspect the Logs page from the user menu. If the problem persists, reach out directly via Email Support (bharatdhuva27@gmail.com) with a brief description of the issue.",
  },

  // Plans & Billing
  {
    id: "faq-11",
    category: "plans-billing",
    question: "Which features are free and which require Outly Pro?",
    answer:
      "The Free plan provides access to the Resume Vault, basic resume checking, and up to 3 saved job applications. Upgrading to Outly Pro unlocks unlimited job application tracking, unlimited resume versions, AI resume tailoring, and advanced cold outreach features.",
  },
  {
    id: "faq-12",
    category: "plans-billing",
    question: "How does the Outly Pro trial work?",
    answer:
      "Outly Pro offers trial access through a secure Razorpay checkout (special ₹1 monthly trial or ₹99 yearly trial). Once verified, your account instantly unlocks unlimited applications and advanced AI tools. You can view or upgrade your plan anytime on the Pricing page.",
  },
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filter FAQs based on search query and category
  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      // Category match
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      // Search query match (both question and answer)
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleTopicClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Smooth scroll to FAQ section
    const faqSection = document.getElementById("faq-section");
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-full w-full font-geist py-8 sm:py-12 px-4 sm:px-6 flex flex-col items-center justify-start animate-fade-in text-neutral-900 select-none">
      <div className="w-full max-w-4xl space-y-12 sm:space-y-16">
        
        {/* ─── SECTION A: COMPACT HERO & SEARCH BAR ─── */}
        <section className="text-center max-w-xl mx-auto space-y-3">
          {/* Eyebrow */}
          <div className="hidden sm:inline-flex items-center gap-2 mb-1">
            <Headset className="w-3.5 h-3.5 text-[#2DC08D]" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-neutral-500">
              HELP CENTER
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-[48px] md:text-[54px] font-bold text-neutral-900 tracking-[-0.035em] leading-[1.06]">
            How can we help you?
          </h1>

          {/* Supporting Text */}
          <p className="text-[14px] sm:text-[15px] text-neutral-500 font-normal leading-relaxed max-w-md mx-auto pt-1">
            Find answers, explore Outly's features, or get in touch directly.
          </p>

          {/* Clean Subtle Search Bar */}
          <div className="pt-4 max-w-xl mx-auto w-full">
            <div className="relative flex items-center w-full">
              <Search className="absolute left-4 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search frequently asked questions..."
                className="w-full pl-11 pr-10 py-3 text-sm rounded-2xl border border-neutral-200/90 bg-white shadow-2xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-800 transition-all"
                aria-label="Search frequently asked questions"
              />
              {searchQuery.trim() !== "" && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Active search filter indicator */}
            {searchQuery.trim() !== "" && (
              <div className="flex items-center justify-between text-xs text-neutral-500 mt-2 px-1">
                <span>
                  Showing results for &ldquo;<strong>{searchQuery}</strong>&rdquo;
                </span>
                <span>
                  {filteredFaqs.length} {filteredFaqs.length === 1 ? "answer" : "answers"} found
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ─── SECTION B: BROWSE HELP TOPICS ─── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-[0.18em] font-semibold text-neutral-400">
              Browse Topics
            </h2>
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="text-xs font-medium text-[#2DC08D] hover:underline cursor-pointer"
              >
                Reset topic filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              const isSelected = selectedCategory === topic.id;

              return (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  className={`group text-left p-6 sm:p-7 rounded-[26px] border bg-white transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.025)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-zinc-900 ring-2 ring-zinc-900/10 shadow-md"
                      : "border-black/[0.06] hover:border-black/15"
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="space-y-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border border-black/[0.03] ${
                        isSelected
                          ? "bg-[#111111] text-white shadow-sm"
                          : "bg-[#F5F5F7] text-zinc-800 group-hover:bg-[#111111] group-hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <h3 className="text-[15px] font-bold text-zinc-900 tracking-tight">
                          {topic.title}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 font-normal">
                        {topic.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-black/[0.04] flex items-center justify-between text-[11px] font-medium text-zinc-400 group-hover:text-zinc-900 transition-colors">
                    <span>Explore questions</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-zinc-500 group-hover:text-zinc-900" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── SECTION C: FREQUENTLY ASKED QUESTIONS ─── */}
        <section id="faq-section" className="space-y-6 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200/80 pb-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                Frequently asked questions
              </h2>
              <p className="text-sm text-neutral-500">
                Quick answers to help you get the most out of Outly.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-neutral-900 text-white shadow-2xs"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                All
              </button>
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedCategory(topic.id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                    selectedCategory === topic.id
                      ? "bg-neutral-900 text-white shadow-2xs"
                      : "bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  {topic.title}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion List or Empty State */}
          {filteredFaqs.length > 0 ? (
            <div className="bg-white border border-black/[0.06] rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.025)] px-6 sm:px-8 py-3 divide-y divide-black/[0.04]">
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="border-b-0 py-1"
                  >
                    <AccordionTrigger className="text-left text-sm font-semibold text-zinc-900 hover:text-black hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-zinc-500 leading-relaxed pt-0 pb-4 font-normal">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border border-black/[0.06] rounded-[28px] p-8 text-center space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.025)]">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-zinc-900">
                  No matching questions found
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  We couldn&apos;t find an answer matching &ldquo;{searchQuery}&rdquo;. Try another search term or email support directly.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleClearSearch}
                  className="px-5 py-2.5 text-xs font-semibold rounded-full border border-black/[0.08] hover:bg-zinc-50 text-zinc-800 transition-colors cursor-pointer"
                >
                  Clear search
                </button>
                <a
                  href={`mailto:${CONTACT_CONFIG.email}?subject=Question%20about%20Outly`}
                  className="px-5 py-2.5 text-xs font-semibold rounded-full bg-[#111111] text-white hover:bg-black transition-colors cursor-pointer"
                >
                  Email Support
                </a>
              </div>
            </div>
          )}
        </section>

        {/* ─── SECTION D: STILL NEED HELP? (THREE VERIFIED CHANNELS ONLY) ─── */}
        <section className="pt-8 border-t border-black/[0.05] space-y-6">
          <div className="text-center space-y-1.5 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Still need a hand?
            </h2>
            <p className="text-sm text-zinc-500 font-normal">
              Couldn&apos;t find what you were looking for? Reach out directly and I&apos;ll do my best to help.
            </p>
          </div>

          {/* Three Compact, Visually Consistent Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1. Email Support */}
            <a
              href={`mailto:${CONTACT_CONFIG.email}?subject=Outly%20Support%20Inquiry`}
              className="group bg-white border border-black/[0.06] rounded-[28px] p-7 sm:p-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.025)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.99]"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] border border-black/[0.03] flex items-center justify-center text-zinc-900 group-hover:bg-[#111111] group-hover:text-white transition-all duration-300">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                      Email Support
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                    Have a question or need help? Send me an email.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-black/[0.04] flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-zinc-900 transition-colors">
                <span>Send email</span>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </a>

            {/* 2. Follow on X */}
            <a
              href={CONTACT_CONFIG.xTwitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white border border-black/[0.06] rounded-[28px] p-7 sm:p-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.025)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.99]"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] border border-black/[0.03] flex items-center justify-center text-zinc-900 group-hover:bg-[#111111] group-hover:text-white transition-all duration-300">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                      Follow on X
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                    Follow product updates, announcements, and insights.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-black/[0.04] flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-zinc-900 transition-colors">
                <span>View profile</span>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </a>

            {/* 3. Visit Portfolio */}
            <a
              href={CONTACT_CONFIG.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white border border-black/[0.06] rounded-[28px] p-7 sm:p-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.025)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.99]"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] border border-black/[0.03] flex items-center justify-center text-zinc-900 group-hover:bg-[#111111] group-hover:text-white transition-all duration-300">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                      Visit Portfolio
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                    Explore my projects, engineering work, and experience.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-black/[0.04] flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-zinc-900 transition-colors">
                <span>Open portfolio</span>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </a>

          </div>
        </section>

      </div>
    </div>
  );
}
