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
  ChevronRight,
  Headset,
  Sparkles,
  Lock,
  CalendarDays,
  Target,
} from "lucide-react";

// ─── VERIFIED CONTACT CHANNELS ───
const CONTACT_CONFIG = {
  email: "bharatdhuva27@gmail.com",
  xTwitterUrl: "https://x.com/mrcrotes",
  portfolioUrl: "https://bharatdhuva.vercel.app",
};

// ─── TOPIC CATEGORIES (Matching Landing Feature Bento) ───
interface Topic {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
}

const TOPICS: Topic[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Master resume upload, workspace setup, and application tracking.",
    badge: "2-min setup",
    icon: Compass,
  },
  {
    id: "resume-tools",
    title: "Resume & AI Tools",
    description: "27-factor ATS scoring, targeted keyword tailoring, and cold outreach.",
    badge: "ATS & Tailor",
    icon: FileText,
  },
  {
    id: "account-privacy",
    title: "Account & Privacy",
    description: "Private storage, zero training data sharing, and security settings.",
    badge: "Never sold",
    icon: ShieldCheck,
  },
  {
    id: "plans-billing",
    title: "Plans & Pro Access",
    description: "Free tier limits, unlimited Pro features, and trial billing verification.",
    badge: "Free & Pro",
    icon: CreditCard,
  },
];

// ─── VERIFIED FAQ ITEMS (Landing + Product Deep Dive) ───
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
    question: "What is Outly and how does it help my job search?",
    answer:
      "Outly is the all-in-one career platform that puts your whole job search in one place. It combines a private Resume Vault, an automated 27-factor ATS score checker, targeted role tailoring, an interactive Kanban application tracker, and a personalized cold email engine.",
  },
  {
    id: "faq-2",
    category: "getting-started",
    question: "How do I get started?",
    answer:
      "Upload your master resume to the Resume Vault. That is the entire setup. Outly takes it from there—you can immediately run an ATS scan to see where you stand or paste a job description to tailor your resume for a specific opening.",
  },
  {
    id: "faq-3",
    category: "getting-started",
    question: "Which job boards and ATS platforms does Outly work with?",
    answer:
      "Bring any job description from LinkedIn, Naukri, Wellfound, Indeed, or company career portals (Workday, Greenhouse, Lever, Taleo, iCIMS). Outly helps you understand requirements, close keyword gaps, and organize applications in your pipeline.",
  },

  // Resume & Career Tools
  {
    id: "faq-4",
    category: "resume-tools",
    question: "How does the 27-factor ATS scoring work?",
    answer:
      "Each application is analyzed across 27 distinct factors evaluated by modern applicant tracking systems: heading hierarchy, date formatting, bullet point action verbs, quantified metrics, keyword density, and parse compatibility. You get an exact score, a keyword gap breakdown, and recruiter-style fixes.",
  },
  {
    id: "faq-5",
    category: "resume-tools",
    question: "How does the AI Resume Tailor work?",
    answer:
      "Paste any job description alongside your active resume. The tailor highlights the exact skills and keywords you already possess that match the role and suggests targeted phrasing enhancements so your application sails through automated filters without losing your own authentic voice.",
  },
  {
    id: "faq-6",
    category: "resume-tools",
    question: "What is the Resume Vault?",
    answer:
      "The Resume Vault is your central document repository. Keep your master resume and customized role-specific variations neatly organized, preview them instantly in PDF format, and pick any version to feed directly into the tailor or cold email tools.",
  },
  {
    id: "faq-7",
    category: "resume-tools",
    question: "How does cold-mail recruiter outreach work?",
    answer:
      "Outly finds relevant hiring managers and recruiters and drafts a concise, high-converting outreach message in your personal voice. You review, edit, and choose what gets drafted or sent—you stay in complete control at every step.",
  },

  // Account & Privacy
  {
    id: "faq-8",
    category: "account-privacy",
    question: "Will my resume be sold or used to train external models?",
    answer:
      "No. Never. Your resume, job applications, notes, and profile data stay strictly yours. We do not sell your personal data or use your resumes to train external machine learning models.",
  },
  {
    id: "faq-9",
    category: "account-privacy",
    question: "Where is my data stored and is it safe?",
    answer:
      "Your documents are stored privately with end-to-end encryption. Your account is protected by industry-standard authentication (Google OAuth 2.0 / secure JWT tokens), and your information is never made public.",
  },
  {
    id: "faq-10",
    category: "account-privacy",
    question: "Is my connected Gmail account safe?",
    answer:
      "Outly only uses connected email services for the specific outreach features you explicitly initiate. All messages are created as drafts for your final review before sending. You can disconnect at any time from Settings.",
  },

  // Plans & Billing
  {
    id: "faq-11",
    category: "plans-billing",
    question: "Is Outly really free?",
    answer:
      "Yes. The Free plan includes three comprehensive ATS scans every 12 hours, Resume Vault storage, AI job search, your application tracker board, and the cold-mail generator. It is genuinely free with no expiration.",
  },
  {
    id: "faq-12",
    category: "plans-billing",
    question: "What does Outly Pro include and how does the trial work?",
    answer:
      "Outly Pro unlocks unlimited 27-factor ATS scans, unlimited resume tailoring, deep keyword gap analysis, unlimited Resume Vault versions, and full outreach automation. Trial options are available starting at ₹1/month or ₹99/year via secure Razorpay checkout.",
  },
  {
    id: "faq-13",
    category: "plans-billing",
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes. You can cancel your Pro plan at any time with a single click. Your saved application history, resumes, and tailored files remain in your account.",
  },
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // Filter FAQs based on search query and category
  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

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
    const faqSection = document.getElementById("faq-section");
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-full w-full bg-[#FAF9F5] text-[#171717] font-sans py-10 sm:py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-start select-none">
      <div className="w-full max-w-4xl space-y-14 sm:space-y-20">

        {/* ─── HERO & SEARCH (Landing Page Style) ─── */}
        <section className="text-center max-w-2xl mx-auto space-y-4">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1F1EF] border border-black/[0.05] text-[11px] font-mono text-[#6B6B66] uppercase tracking-[0.18em]">
            <span className="w-2 h-2 rounded-full bg-[#12A394]" />
            <span>Support &amp; Knowledge Base</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-[54px] font-medium text-[#171717] tracking-[-0.045em] leading-[1.08] m-0">
            Clear answers for a<br />
            <i className="font-normal font-serif italic text-[#12A394]">better next step.</i>
          </h1>

          {/* Subtitle */}
          <p className="text-[14px] sm:text-[15.5px] text-[#6B6B66] font-normal leading-relaxed max-w-lg mx-auto pt-1">
            Explore 27-factor ATS scoring, tailored applications, data privacy, and direct engineering support.
          </p>

          {/* Search Bar (Landing Floating Pill Style) */}
          <div className="pt-4 max-w-xl mx-auto w-full">
            <div className="relative flex items-center w-full bg-white/90 backdrop-blur-md rounded-full border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.04)] focus-within:border-[#12A394] focus-within:ring-2 focus-within:ring-[#12A394]/15 transition-all">
              <Search className="absolute left-4 w-4 h-4 text-[#12A394] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs, ATS tips, or account questions..."
                className="w-full pl-11 pr-11 py-3.5 text-[13.5px] bg-transparent text-[#171717] placeholder:text-[#9A9A95] focus:outline-none rounded-full"
                aria-label="Search questions"
              />
              {searchQuery.trim() !== "" && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3.5 p-1 rounded-full text-[#888] hover:text-[#111] hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter query indicator */}
            {searchQuery.trim() !== "" && (
              <div className="flex items-center justify-between text-xs text-[#6B6B66] mt-2.5 px-2 font-mono">
                <span>
                  Showing results for &ldquo;<strong>{searchQuery}</strong>&rdquo;
                </span>
                <span>
                  {filteredFaqs.length} {filteredFaqs.length === 1 ? "answer" : "answers"}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ─── TOPIC CARDS (Landing Bento Card Style) ─── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] font-semibold text-[#8A8A85]">
              Browse Topics
            </h2>
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="text-xs font-medium text-[#12A394] hover:underline cursor-pointer"
              >
                Reset topic filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              const isSelected = selectedCategory === topic.id;

              return (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  className={`group text-left p-6 rounded-[22px] bg-white transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                    isSelected
                      ? "border-[#12A394] ring-2 ring-[#12A394]/15 shadow-[0_8px_24px_rgba(18,163,148,0.12)]"
                      : "border-black/[0.06] hover:border-[#12A394]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="space-y-3.5">
                    {/* Top row: Icon + Topic Badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-[#12A394] text-white"
                            : "bg-[#12A394]/10 text-[#12A394] group-hover:bg-[#12A394] group-hover:text-white"
                        }`}
                      >
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8A85] bg-[#F7F7F5] px-2 py-0.5 rounded-full border border-black/[0.04]">
                        {topic.badge}
                      </span>
                    </div>

                    {/* Title & Copy */}
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#171717] tracking-tight m-0">
                        {topic.title}
                      </h3>
                      <p className="text-[12px] text-[#6B6B66] leading-relaxed mt-1 mb-0 line-clamp-2">
                        {topic.description}
                      </p>
                    </div>
                  </div>

                  {/* Card bottom CTA */}
                  <div className="pt-4 mt-4 border-t border-black/[0.04] flex items-center justify-between text-[11.5px] font-medium text-[#8A8A85] group-hover:text-[#12A394] transition-colors">
                    <span>View answers</span>
                    <ArrowUpRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#12A394]"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── FREQUENTLY ASKED QUESTIONS (Landing FAQ Style) ─── */}
        <section id="faq-section" className="space-y-6 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/[0.08] pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.035em] text-[#171717] m-0">
                Frequently asked questions
              </h2>
              <p className="text-[13.5px] text-[#6B6B66] mt-1 mb-0">
                Straightforward answers to help you navigate your job search with Outly.
              </p>
            </div>

            {/* Category Filter Pills (Landing Filter Style) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-[#111111] text-white shadow-xs"
                    : "bg-white border border-black/[0.07] text-[#6B6B66] hover:text-[#111] hover:bg-neutral-50"
                }`}
              >
                All
              </button>
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedCategory(topic.id)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                    selectedCategory === topic.id
                      ? "bg-[#111111] text-white shadow-xs"
                      : "bg-white border border-black/[0.07] text-[#6B6B66] hover:text-[#111] hover:bg-neutral-50"
                  }`}
                >
                  {topic.title}
                </button>
              ))}
            </div>
          </div>

          {/* Landing-style Minimalist Accordion List */}
          {filteredFaqs.length > 0 ? (
            <div className="bg-white border border-black/[0.06] rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] px-6 sm:px-8 py-2 divide-y divide-black/[0.06]">
              {filteredFaqs.map((faq) => {
                const isOpen = openFaq === faq.id;

                return (
                  <article key={faq.id} className="py-1">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between text-left py-4 min-h-[50px] bg-transparent border-none cursor-pointer group"
                    >
                      <span className="text-[14.5px] font-medium text-[#171717] group-hover:text-[#12A394] transition-colors pr-4 tracking-[-0.01em]">
                        {faq.question}
                      </span>
                      <span
                        className={`w-6 h-6 flex items-center justify-center shrink-0 text-[#8A8A85] transition-transform duration-200 ${
                          isOpen ? "rotate-90 text-[#12A394]" : "group-hover:text-[#111]"
                        }`}
                      >
                        <ChevronRight size={17} />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="pb-4 pr-6 text-[13.5px] text-[#6B6B66] leading-relaxed font-normal animate-in fade-in duration-200">
                        <p className="m-0">{faq.answer}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border border-black/[0.06] rounded-[24px] p-10 text-center space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-2xl bg-[#F7F7F5] text-[#8A8A85] flex items-center justify-center mx-auto">
                <HelpCircle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#171717] m-0">
                  No matching questions found
                </h3>
                <p className="text-xs text-[#6B6B66] max-w-sm mx-auto m-0">
                  We couldn&apos;t find an answer matching &ldquo;{searchQuery}&rdquo;. Try another search term or reach out directly.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-5 py-2.5 text-xs font-medium rounded-full border border-black/[0.08] hover:bg-black/5 text-[#171717] transition-colors cursor-pointer"
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

        {/* ─── CONTACT SECTION ("Still Need Help?" - Landing Feature Cards) ─── */}
        <section className="pt-8 border-t border-black/[0.06] space-y-6">
          <div className="text-center space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.035em] text-[#171717] m-0">
              Still need a hand?
            </h2>
            <p className="text-[13.5px] text-[#6B6B66] font-normal m-0">
              Couldn&apos;t find what you were looking for? Reach out directly and I&apos;ll be glad to help.
            </p>
          </div>

          {/* Three Landing-Style Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* 1. Email Support */}
            <a
              href={`mailto:${CONTACT_CONFIG.email}?subject=Outly%20Support%20Inquiry`}
              className="group bg-white border border-black/[0.06] hover:border-[#12A394]/40 rounded-[22px] p-6 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-inherit no-underline"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#12A394]/10 text-[#12A394] group-hover:bg-[#12A394] group-hover:text-white flex items-center justify-center transition-colors">
                  <Mail size={18} strokeWidth={2} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12A394]" />
                    <h3 className="text-[15px] font-semibold text-[#171717] tracking-tight m-0">
                      Email Support
                    </h3>
                  </div>
                  <p className="text-[12px] text-[#6B6B66] leading-relaxed font-normal m-0">
                    Have a technical question or feedback? Send an email directly.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-black/[0.04] flex items-center justify-between text-[11.5px] font-medium text-[#8A8A85] group-hover:text-[#12A394] transition-colors">
                <span>Send email</span>
                <ArrowUpRight size={14} className="text-[#12A394] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </a>

            {/* 2. Follow on X */}
            <a
              href={CONTACT_CONFIG.xTwitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white border border-black/[0.06] hover:border-[#12A394]/40 rounded-[22px] p-6 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-inherit no-underline"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#12A394]/10 text-[#12A394] group-hover:bg-[#12A394] group-hover:text-white flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12A394]" />
                    <h3 className="text-[15px] font-semibold text-[#171717] tracking-tight m-0">
                      Follow on X
                    </h3>
                  </div>
                  <p className="text-[12px] text-[#6B6B66] leading-relaxed font-normal m-0">
                    Follow product updates, engineering insights, and changelog.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-black/[0.04] flex items-center justify-between text-[11.5px] font-medium text-[#8A8A85] group-hover:text-[#12A394] transition-colors">
                <span>View profile</span>
                <ArrowUpRight size={14} className="text-[#12A394] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </a>

            {/* 3. Visit Portfolio */}
            <a
              href={CONTACT_CONFIG.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white border border-black/[0.06] hover:border-[#12A394]/40 rounded-[22px] p-6 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-inherit no-underline"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#12A394]/10 text-[#12A394] group-hover:bg-[#12A394] group-hover:text-white flex items-center justify-center transition-colors">
                  <Globe size={18} strokeWidth={2} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12A394]" />
                    <h3 className="text-[15px] font-semibold text-[#171717] tracking-tight m-0">
                      Visit Portfolio
                    </h3>
                  </div>
                  <p className="text-[12px] text-[#6B6B66] leading-relaxed font-normal m-0">
                    Explore my projects, engineering background, and work.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-black/[0.04] flex items-center justify-between text-[11.5px] font-medium text-[#8A8A85] group-hover:text-[#12A394] transition-colors">
                <span>Open portfolio</span>
                <ArrowUpRight size={14} className="text-[#12A394] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </a>

          </div>
        </section>

      </div>
    </div>
  );
}
