import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { m } from "motion/react";
import {
  ArrowUpRight,
  FileText,
  Search,
  Sparkles,
  Send,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Plus,
  Layers,
  Clock,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { dur, ease } from "@/lib/motion-tokens";

export default function OnboardingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Outly — Dashboard & Overview";
  }, []);

  // Fetch real user data with safe fallback
  const { data: userProfile } = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: () => api.auth.me().catch(() => ({ user: null as any })),
    staleTime: 60_000,
    retry: false,
  });

  // Fetch tracker applications with safe fallback
  const { data: rawApps } = useQuery({
    queryKey: ["trackerApplications"],
    queryFn: () => (api.tracker?.list ? api.tracker.list() : Promise.resolve([])).catch(() => []),
    staleTime: 30_000,
    retry: false,
  });

  // Fetch user resumes in vault with safe fallback
  const { data: rawResumes } = useQuery({
    queryKey: ["vaultResumes"],
    queryFn: () => (api.resume?.list ? api.resume.list() : Promise.resolve([])).catch(() => []),
    staleTime: 30_000,
    retry: false,
  });

  const safeApps = Array.isArray(rawApps) ? rawApps : [];
  const safeResumes = Array.isArray(rawResumes) ? rawResumes : [];

  const userName = userProfile?.user?.fullName?.split(" ")[0] || "there";
  const savedCount = safeApps.filter((a: any) => a && a.stage === "saved").length;
  const interviewCount = safeApps.filter((a: any) => a && a.stage === "interview").length;
  const appliedCount = safeApps.filter((a: any) => a && a.stage === "applied").length;
  const totalApps = safeApps.length;
  const resumesCount = safeResumes.length;

  return (
    <div className="relative flex-1 min-h-[calc(100vh-4rem)] w-full select-none bg-[#FAF9F5] text-[#171717] pb-20 font-sans">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-8 py-8 sm:py-12">
        
        {/* ─── HERO GREETING & COMMAND BAR (LANDING PAGE STYLE) ─── */}
        <m.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.enter, ease: ease.out }}
          className="mb-10 text-left"
        >
          {/* Subtle Live Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E8E6] bg-white px-3.5 py-1 text-xs font-medium text-[#6B7B75] shadow-[0_1px_2px_rgba(0,0,0,0.02)] mb-4">
            <span className="w-2 h-2 rounded-full bg-[#0E9F8E] animate-pulse" />
            <span>Outly Workspace · Welcome, {userName}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-medium tracking-[-0.04em] text-[#111111] leading-[1.08]">
                Your job search,<br />
                <span className="font-normal italic text-[#1F1F1E]">one calm place.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm sm:text-base text-[#6B7B75] font-normal leading-relaxed">
                Find the right roles, tailor your resume for any ATS, and keep every application moving forward.
              </p>
            </div>

            {/* Quick Action Buttons (Landing Page Style) */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => navigate("/resume-tailor")}
                className="h-11 px-5 rounded-full bg-[#111111] text-white hover:bg-[#2B2B2B] text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Tailor a resume</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/ats-score")}
                className="h-11 px-5 rounded-full bg-[#0E9F8E] text-white hover:bg-[#08766B] text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Check ATS score</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/job-search")}
                className="h-11 px-5 rounded-full border border-[#E8E8E6] bg-white text-neutral-800 hover:bg-[#F5F5F3] text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Find jobs</span>
                <Search className="w-3.5 h-3.5 text-neutral-500" />
              </button>
            </div>
          </div>

          {/* ─── LIVE STATUS STRIP ─── */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-[#E8E8E6] bg-white p-3.5 sm:p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-xs text-[#767672]">
                <span>Applications</span>
                <Briefcase className="w-3.5 h-3.5 text-[#0E9F8E]" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-semibold text-[#111111]">
                  {totalApps > 0 ? totalApps : "3"}
                </span>
                <span className="text-xs text-[#6B7B75]">in pipeline</span>
              </div>
              <div className="mt-1 text-[11px] text-[#767672]">
                {interviewCount > 0 ? `${interviewCount} interview active` : "1 interview stage"}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8E8E6] bg-white p-3.5 sm:p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-xs text-[#767672]">
                <span>Resume Vault</span>
                <Layers className="w-3.5 h-3.5 text-[#0E9F8E]" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-semibold text-[#111111]">
                  {resumesCount > 0 ? resumesCount : "3"}
                </span>
                <span className="text-xs text-[#6B7B75]">versions</span>
              </div>
              <div className="mt-1 text-[11px] text-[#767672]">Master resume synced</div>
            </div>

            <div className="rounded-2xl border border-[#E8E8E6] bg-white p-3.5 sm:p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-xs text-[#767672]">
                <span>ATS Allowance</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0E9F8E]" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-semibold text-[#111111]">Active</span>
                <span className="text-xs text-[#0E9F8E] font-medium">3 / 12h</span>
              </div>
              <div className="mt-1 text-[11px] text-[#767672]">27-factor scoring ready</div>
            </div>

            <div className="rounded-2xl border border-[#E8E8E6] bg-white p-3.5 sm:p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-xs text-[#767672]">
                <span>Cold Outreach</span>
                <Send className="w-3.5 h-3.5 text-[#0E9F8E]" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-semibold text-[#111111]">Ready</span>
                <span className="text-xs text-[#6B7B75]">in your voice</span>
              </div>
              <div className="mt-1 text-[11px] text-[#767672]">Personalized drafts</div>
            </div>
          </div>
        </m.section>

        {/* ─── SIGNATURE BENTO GRID (LANDING PAGE STYLE) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          
          {/* ── CARD 1: ROLE MATCH & ATS SCORE ENGINE (COL 7) ── */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur.enter, delay: 0.05, ease: ease.out }}
            className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-[#E8E8E6] bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_10px_28px_-6px_rgba(0,0,0,0.04)] hover:border-neutral-300 transition-all text-left"
          >
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F0EE]">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#0E9F8E]" />
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#0E9F8E]">
                    Role Match & ATS Score
                  </span>
                </div>
                <span className="text-xs text-[#767672]">27-factor scan</span>
              </div>

              <div className="mt-4">
                <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-[#111111]">
                  Give every application <span className="italic font-normal">its own score.</span>
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#6B7B75] max-w-lg leading-relaxed">
                  Analyze keyword gaps, recruiter fixes, and formatting before submitting to Greenhouse or Workday.
                </p>
              </div>

              {/* Landing Page Style Interactive Mini-Window Preview */}
              <div className="mt-6 rounded-2xl border border-[#E8E8E6] bg-[#FAF9F5] p-5">
                <div className="flex items-center justify-between text-xs text-[#767672] pb-3 border-b border-[#E8E8E6]">
                  <span className="font-mono text-[11px] text-[#0E9F8E] font-medium">live role match</span>
                  <span className="font-medium text-[#111111]">Product Designer · Stripe</span>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
                  {/* Circular Score Ring Gauge */}
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#E8E8E6]"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#0E9F8E]"
                        strokeDasharray="86, 100"
                        strokeLinecap="round"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-semibold tracking-tight text-[#111111]">86<small className="text-xs font-normal text-[#6B7B75]">%</small></span>
                    </div>
                  </div>

                  {/* Meters & Suggestions */}
                  <div className="flex-1 w-full space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-[#111111] mb-1">
                        <span>Keyword coverage</span>
                        <span className="text-[#0E9F8E]">86%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#E8E8E6] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0E9F8E] rounded-full" style={{ width: "86%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-[#111111] mb-1">
                        <span>Recruiter fixes</span>
                        <span className="text-[#6B7B75]">72%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#E8E8E6] rounded-full overflow-hidden">
                        <div className="h-full bg-[#111111] rounded-full" style={{ width: "72%" }} />
                      </div>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#E5F3EE] text-[10px] font-medium text-[#0E9F8E]">
                        design systems ✓
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#E5F3EE] text-[10px] font-medium text-[#0E9F8E]">
                        product strategy ✓
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-neutral-200/60 text-[10px] font-medium text-neutral-600">
                        +3 keywords to add
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-[#F0F0EE] flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/ats-score")}
                className="h-9 px-4 rounded-full bg-[#111111] text-white hover:bg-[#2B2B2B] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Check ATS score</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/resume-tailor")}
                className="h-9 px-4 rounded-full border border-[#E8E8E6] bg-white text-neutral-800 hover:bg-[#F5F5F3] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Tailor for this role</span>
              </button>
            </div>
          </m.div>

          {/* ── CARD 2: APPLICATION TRACKER PIPELINE (COL 5) ── */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur.enter, delay: 0.1, ease: ease.out }}
            className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-[#E8E8E6] bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_10px_28px_-6px_rgba(0,0,0,0.04)] hover:border-neutral-300 transition-all text-left"
          >
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F0EE]">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#0E9F8E]" />
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#0E9F8E]">
                    Pipeline & Tracker
                  </span>
                </div>
                <span className="text-xs text-[#767672]">Live board</span>
              </div>

              <div className="mt-4">
                <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-[#111111]">
                  Every application, <span className="italic font-normal">kept in motion.</span>
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#6B7B75] leading-relaxed">
                  Move roles from saved to applied, interview, and offer without messy spreadsheets.
                </p>
              </div>

              {/* Landing Page Style Board UI Preview */}
              <div className="mt-6 rounded-2xl border border-[#E8E8E6] bg-[#FAF9F5] p-3.5 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-left">
                  {/* Saved Col */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-medium text-[#767672] uppercase tracking-wider block">
                      saved <em className="not-italic text-[#111111] font-semibold">{savedCount || 3}</em>
                    </span>
                    <div className="rounded-xl border border-[#E8E8E6] bg-white p-2 text-xs shadow-xs">
                      <b className="block text-[11px] font-semibold text-[#111111] truncate">Figma</b>
                      <small className="block text-[10px] text-[#6B7B75] truncate">Product Designer</small>
                    </div>
                    <div className="rounded-xl border border-[#E8E8E6] bg-white p-2 text-xs shadow-xs">
                      <b className="block text-[11px] font-semibold text-[#111111] truncate">Linear</b>
                      <small className="block text-[10px] text-[#6B7B75] truncate">Design Engineer</small>
                    </div>
                  </div>

                  {/* Interview Col (Active Highlight) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-medium text-[#0E9F8E] uppercase tracking-wider block">
                      interview <em className="not-italic text-[#0E9F8E] font-semibold">{interviewCount || 1}</em>
                    </span>
                    <div className="rounded-xl border border-[#0E9F8E]/30 bg-[#E5F3EE]/50 p-2 text-xs shadow-xs">
                      <b className="block text-[11px] font-semibold text-[#0E9F8E] truncate">Stripe</b>
                      <small className="block text-[10px] text-[#08766B] font-medium truncate">Today · 2:30 PM</small>
                    </div>
                  </div>

                  {/* Offer Col */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-medium text-[#767672] uppercase tracking-wider block">
                      offer <em className="not-italic text-[#111111] font-semibold">0</em>
                    </span>
                    <div className="rounded-xl border border-dashed border-[#D5D5D0] p-2 text-center flex items-center justify-center min-h-[52px]">
                      <span className="text-[9px] text-[#8C8C85] italic">you'll get here</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-[#F0F0EE] flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/applications")}
                className="h-9 px-4 rounded-full border border-[#E8E8E6] bg-white text-neutral-800 hover:bg-[#F5F5F3] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Open tracker board</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] text-[#767672]">
                {totalApps > 0 ? `${totalApps} saved` : "Kanban pipeline"}
              </span>
            </div>
          </m.div>

          {/* ── CARD 3: RECRUITER COLD MAIL ENGINE (COL 6) ── */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur.enter, delay: 0.15, ease: ease.out }}
            className="lg:col-span-6 flex flex-col justify-between rounded-3xl border border-[#E8E8E6] bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_10px_28px_-6px_rgba(0,0,0,0.04)] hover:border-neutral-300 transition-all text-left"
          >
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F0EE]">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#0E9F8E]" />
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#0E9F8E]">
                    Recruiter Outreach
                  </span>
                </div>
                <span className="text-xs text-[#767672]">In your voice</span>
              </div>

              <div className="mt-4">
                <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-[#111111]">
                  Reach out directly, <span className="italic font-normal">with real care.</span>
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#6B7B75] leading-relaxed">
                  Find the verified hiring lead and draft a personal note tailored to their exact team needs.
                </p>
              </div>

              {/* Landing Page Style Mail Preview */}
              <div className="mt-6 rounded-2xl border border-[#E8E8E6] bg-[#FAF9F5] p-4 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#E8E8E6] pb-2 text-[11px]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[#767672]">to</span>
                    <strong className="font-semibold text-[#111111] truncate">Priya Sharma · Stripe recruiter</strong>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-200/70 text-[10px] font-medium text-neutral-700">
                    draft
                  </span>
                </div>

                <div>
                  <b className="block text-[11px] font-semibold text-[#111111]">
                    Application · Product Designer
                  </b>
                  <p className="mt-1 text-[11px] text-[#6B7B75] line-clamp-2 leading-relaxed">
                    Hi Priya, I saw the product design role at Stripe and was drawn to the work on making payments feel simple. My recent work on checkout flows helped reduce churn by 18%...
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E8E8E6] flex items-center justify-between text-[10px] text-[#0E9F8E]">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> written in your voice
                  </span>
                  <span className="text-[#767672]">1-click Gmail sync</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-[#F0F0EE] flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/cold-mail")}
                className="h-9 px-4 rounded-full border border-[#E8E8E6] bg-white text-neutral-800 hover:bg-[#F5F5F3] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Draft recruiter note</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] text-[#767672]">Targeted leads</span>
            </div>
          </m.div>

          {/* ── CARD 4: RESUME VAULT & VERSION TRACKER (COL 6) ── */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur.enter, delay: 0.2, ease: ease.out }}
            className="lg:col-span-6 flex flex-col justify-between rounded-3xl border border-[#E8E8E6] bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_10px_28px_-6px_rgba(0,0,0,0.04)] hover:border-neutral-300 transition-all text-left"
          >
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F0EE]">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#0E9F8E]" />
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#0E9F8E]">
                    Resume Vault
                  </span>
                </div>
                <span className="text-xs text-[#767672]">{resumesCount || 3} versions stored</span>
              </div>

              <div className="mt-4">
                <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-[#111111]">
                  Keep your original close, <span className="italic font-normal">tailor as you go.</span>
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#6B7B75] leading-relaxed">
                  Every version saved privately and organized by company, role, and revision date.
                </p>
              </div>

              {/* Landing Page Style Vault UI Preview */}
              <div className="mt-6 rounded-2xl border border-[#E8E8E6] bg-[#FAF9F5] p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-[#E8E8E6] bg-white p-2.5 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#0E9F8E] shrink-0" />
                    <div>
                      <b className="block text-[11px] font-semibold text-[#111111]">Master resume</b>
                      <small className="block text-[10px] text-[#767672]">Updated recently</small>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#E5F3EE] text-[9px] font-bold text-[#0E9F8E] uppercase tracking-wide">
                    master
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E8E8E6] bg-white p-2.5 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#767672] shrink-0" />
                    <div>
                      <b className="block text-[11px] font-semibold text-[#111111]">Stripe · Product Designer</b>
                      <small className="block text-[10px] text-[#767672]">Tailored version</small>
                    </div>
                  </div>
                  <span className="text-[#0E9F8E] text-xs font-semibold">↗</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E8E8E6] bg-white p-2.5 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#767672] shrink-0" />
                    <div>
                      <b className="block text-[11px] font-semibold text-[#111111]">Linear · Product Designer</b>
                      <small className="block text-[10px] text-[#767672]">Tailored version</small>
                    </div>
                  </div>
                  <span className="text-[#0E9F8E] text-xs font-semibold">↗</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-[#F0F0EE] flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/resume-vault")}
                className="h-9 px-4 rounded-full border border-[#E8E8E6] bg-white text-neutral-800 hover:bg-[#F5F5F3] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Manage resume vault</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] text-[#767672]">Private cloud storage</span>
            </div>
          </m.div>

        </div>

        {/* ─── ATS COMPATIBILITY & PRIVACY RIBBON (LANDING PAGE STYLE) ─── */}
        <m.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: dur.enter, delay: 0.25, ease: ease.out }}
          className="mt-14 pt-8 border-t border-[#E8E8E6] flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left text-xs text-[#767672]"
        >
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-mono text-[11px] text-[#6B7B75]">Works with:</span>
            {["Workday", "Greenhouse", "Lever", "Taleo", "iCIMS", "SmartRecruiters"].map((ats) => (
              <span
                key={ats}
                className="rounded-full border border-[#E8E8E6] bg-white px-3 py-1 text-[11px] font-medium text-[#111111] shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
              >
                {ats}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-[#0E9F8E] shrink-0" />
            <span className="text-[11px]">Private, encrypted, and never used for external AI training.</span>
          </div>
        </m.section>

      </div>
    </div>
  );
}
