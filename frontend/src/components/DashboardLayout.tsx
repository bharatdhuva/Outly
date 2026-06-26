import { useEffect, useRef, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import logoTransparent from "@/assets/brand/logo_transparent.png";
import {
  ScrollText,
  Settings as SettingsIcon,
  ChevronDown,
  Menu,
  X,
  LogOut,
  KeyRound
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

const pageTitles: Record<string, string> = {
  "/onboarding": "Overview",
  "/cold-mail": "Cold Mail",
  "/linkedin-posts": "LinkedIn Posts",
  "/twitter": "Twitter / X",
  "/settings": "Settings",
  "/logs": "Logs",
  "/resume-tailor": "Resume Tailor",
  "/ats-score": "ATS Score",
  "/applications": "Applications",
  "/resume-vault": "Resume Vault",
  "/analytics": "Analytics"
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Hover states for desktop dropdowns
  const [activeDropdown, setActiveDropdown] = useState<"resumes" | "jobs" | "tools" | null>(null);
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const dropdownCloseTimer = useRef<number | null>(null);

  // Fetch settings from API to personalize the dashboard profile
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });

  const pageTitle = pageTitles[location.pathname] ?? "Page Not Found";

  useEffect(() => {
    document.title = `Outly - ${pageTitle}`;
  }, [pageTitle]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (dropdownCloseTimer.current) {
        window.clearTimeout(dropdownCloseTimer.current);
      }
    };
  }, []);

  const fullName = settings?.full_name || "Outly User";
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "OU";

  const handleLogout = () => {
    // Clear token if stored in cookies/localStorage, then navigate to login
    navigate("/login");
  };

  const openDropdown = (dropdown: "resumes" | "jobs" | "tools") => {
    if (dropdownCloseTimer.current) {
      window.clearTimeout(dropdownCloseTimer.current);
      dropdownCloseTimer.current = null;
    }
    setActiveDropdown(dropdown);
  };

  const scheduleDropdownClose = () => {
    if (dropdownCloseTimer.current) {
      window.clearTimeout(dropdownCloseTimer.current);
    }
    dropdownCloseTimer.current = window.setTimeout(() => {
      setActiveDropdown(null);
      dropdownCloseTimer.current = null;
    }, 260);
  };

  const toggleDropdown = (dropdown: "resumes" | "jobs" | "tools") => {
    if (dropdownCloseTimer.current) {
      window.clearTimeout(dropdownCloseTimer.current);
      dropdownCloseTimer.current = null;
    }
    setActiveDropdown((current) => (current === dropdown ? null : dropdown));
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-outly-dark flex flex-col font-sans">
      
      {/* ─── TOP NAVIGATION HEADER (ENHANCV STYLE) ─── */}
      <header className="sticky top-0 z-40 w-full border-b border-[#e8e2d5] bg-white/95 backdrop-blur-md shadow-sm shrink-0 select-none">
        <div className="flex h-16 w-full items-center justify-between px-8 sm:px-10 lg:px-12">
          
          {/* Left: Brand Logo */}
          <div className="flex h-full items-center gap-12">
            <Link to="/onboarding" className="flex h-full -translate-y-px items-center gap-1 font-bold text-xl leading-none tracking-tight hover:opacity-90 transition-opacity">
              <img src={logoTransparent} alt="Outly Logo" className="h-8 w-8 -translate-y-px object-contain" />
              <span className="text-outly-accent leading-none">Outly</span>
            </Link>

            {/* Middle: Desktop Links & Dropdowns */}
            <nav className="hidden h-full items-center gap-8 font-['Inter',system-ui,sans-serif] md:flex">
              
              {/* Dropdown 1: RESUMES */}
              <div 
                className="relative h-full flex items-center"
                onMouseEnter={() => openDropdown("resumes")}
                onMouseLeave={scheduleDropdownClose}
              >
                <button 
                  type="button"
                  onClick={() => toggleDropdown("resumes")}
                  className={`flex h-full items-center gap-1.5 border-b-2 text-[16px] font-medium leading-none tracking-normal transition-colors duration-200 ${
                    location.pathname.startsWith("/resume-") || location.pathname === "/ats-score" || location.pathname === "/resume-vault"
                      ? "border-primary text-primary" 
                      : "border-transparent text-outly-dark/70 hover:text-outly-accent"
                  }`}
                >
                  <span>Resume</span>
                  <ChevronDown className={`h-4 w-4 translate-y-px transition-transform duration-200 ${activeDropdown === "resumes" ? "rotate-180 text-primary" : ""}`} />
                </button>

                {activeDropdown === "resumes" && (
                  <div
                    className="absolute left-0 top-full z-50 grid w-[540px] grid-cols-12 gap-5 rounded-2xl border border-border bg-card p-5 shadow-xl animate-slide-up select-none"
                    onMouseEnter={() => openDropdown("resumes")}
                    onMouseLeave={scheduleDropdownClose}
                  >
                    {/* Left: Tools */}
                    <div className="col-span-7 space-y-2.5">
                      <div className="text-[9px] font-extrabold text-muted-foreground/50 uppercase tracking-[0.15em] mb-1 px-1">Tools</div>
                      <div className="space-y-1">
                        <Link 
                          to="/ats-score" 
                          className="flex items-center gap-4 rounded-xl p-2 hover:bg-muted/50 transition duration-155 group text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-outly-accent transition duration-150">
                            {/* Circle Check (ATS Resume Checker) */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="8 12 11 15 16 9" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-[13px] font-bold text-outly-dark/70 group-hover:text-outly-accent transition duration-150">ATS Resume Checker</span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Analyze your resume against ATS algorithms.</span>
                          </div>
                        </Link>

                        <Link 
                          to="/resume-tailor" 
                          className="flex items-center gap-4 rounded-xl p-2 hover:bg-muted/50 transition duration-155 group text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-outly-accent transition duration-150">
                            {/* 3D Cube (AI Resume Builder) */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                              <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-[13px] font-bold text-outly-dark/70 group-hover:text-outly-accent transition duration-150">Tailor Resume</span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Tailor your CV for specific job descriptions.</span>
                          </div>
                        </Link>

                        <Link 
                          to="/resume-vault" 
                          className="flex items-center gap-4 rounded-xl p-2 hover:bg-muted/50 transition duration-155 group text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-outly-accent transition duration-150">
                            {/* Document List (Resume Examples) */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-[13px] font-bold text-outly-dark/70 group-hover:text-outly-accent transition duration-150">Resume Vault</span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Manage saved resumes and tailored versions.</span>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Right: Learning */}
                    <div className="col-span-5 border-l border-border pl-4 space-y-2.5">
                      <div className="text-[9px] font-extrabold text-muted-foreground/50 uppercase tracking-[0.15em] mb-1">Learning</div>
                      <div className="space-y-3.5 pt-1">
                        <button 
                          onClick={() => setActiveGuide("how-to-write")}
                          className="block text-[11.5px] font-semibold text-outly-dark/70 hover:text-outly-accent hover:translate-x-0.5 transition duration-200 text-left w-full"
                        >
                          How to write a resume
                        </button>
                        <button 
                          onClick={() => setActiveGuide("resume-format")}
                          className="block text-[11.5px] font-semibold text-outly-dark/70 hover:text-outly-accent hover:translate-x-0.5 transition duration-200 text-left w-full"
                        >
                          Choosing a resume format
                        </button>
                        <button 
                          onClick={() => setActiveGuide("resume-summary")}
                          className="block text-[11.5px] font-semibold text-outly-dark/70 hover:text-outly-accent hover:translate-x-0.5 transition duration-200 text-left w-full"
                        >
                          Writing a resume summary
                        </button>
                        <button 
                          onClick={() => setActiveGuide("one-page")}
                          className="block text-[11.5px] font-semibold text-outly-dark/70 hover:text-outly-accent hover:translate-x-0.5 transition duration-200 text-left w-full"
                        >
                          Fit experience on one page
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown 2: JOBS */}
              <div 
                className="relative h-full flex items-center"
                onMouseEnter={() => openDropdown("jobs")}
                onMouseLeave={scheduleDropdownClose}
              >
                <button 
                  type="button"
                  onClick={() => toggleDropdown("jobs")}
                  className={`flex h-full items-center gap-1.5 border-b-2 text-[16px] font-medium leading-none tracking-normal transition-colors duration-200 ${
                    location.pathname === "/applications" || location.pathname === "/analytics"
                      ? "border-primary text-primary" 
                      : "border-transparent text-outly-dark/70 hover:text-outly-accent"
                  }`}
                >
                  <span>Jobs</span>
                  <ChevronDown className={`h-4 w-4 translate-y-px transition-transform duration-200 ${activeDropdown === "jobs" ? "rotate-180 text-primary" : ""}`} />
                </button>

                {activeDropdown === "jobs" && (
                  <div
                    className="absolute left-0 top-full z-50 grid w-[540px] grid-cols-12 gap-5 rounded-2xl border border-border bg-card p-5 shadow-xl animate-slide-up select-none"
                    onMouseEnter={() => openDropdown("jobs")}
                    onMouseLeave={scheduleDropdownClose}
                  >
                    {/* Left: Job Search */}
                    <div className="col-span-7 space-y-2.5">
                      <div className="text-[9px] font-extrabold text-muted-foreground/50 uppercase tracking-[0.15em] mb-1 px-1">Job Search</div>
                      <div className="space-y-1">
                        <Link 
                          to="/analytics" 
                          className="flex items-center gap-4 rounded-xl p-2 hover:bg-muted/50 transition duration-155 group text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-outly-accent transition duration-150">
                            {/* Speech Bubble (Interview Help) */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-[13px] font-bold text-outly-dark/70 group-hover:text-outly-accent transition duration-150">Interview Help</span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Practice with AI mock interviews and analytics.</span>
                          </div>
                        </Link>
                        
                        <Link 
                          to="/applications" 
                          className="flex items-center gap-4 rounded-xl p-2 hover:bg-muted/50 transition duration-155 group text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-outly-accent transition duration-150">
                            {/* Target/Bullseye (Job Tracker) */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="6" />
                              <circle cx="12" cy="12" r="2" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-[13px] font-bold text-outly-dark/70 group-hover:text-outly-accent transition duration-150">Job Tracker</span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Organize your applications in a visual board.</span>
                          </div>
                        </Link>

                        <Link 
                          to="/applications?tab=search" 
                          className="flex items-center gap-4 rounded-xl p-2 hover:bg-muted/50 transition duration-155 group text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-outly-accent transition duration-150">
                            {/* Office Building (Job Board) — Enhancv style */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                              <line x1="9" y1="22" x2="9" y2="16" />
                              <line x1="9" y1="16" x2="15" y2="16" />
                              <line x1="15" y1="16" x2="15" y2="22" />
                              <line x1="9" y1="8" x2="9.01" y2="8" />
                              <line x1="15" y1="8" x2="15.01" y2="8" />
                              <line x1="9" y1="12" x2="9.01" y2="12" />
                              <line x1="15" y1="12" x2="15.01" y2="12" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-[13px] font-bold text-outly-dark/70 group-hover:text-outly-accent transition duration-150">Job Board</span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Find matches and track them instantly.</span>
                          </div>
                        </Link>

                        <Link 
                          to="/settings" 
                          className="flex items-center gap-4 rounded-xl p-2 hover:bg-muted/50 transition duration-155 group text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-outly-accent transition duration-150">
                            {/* Chrome Logo (Chrome Extension) */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="4" />
                              <line x1="12" y1="8" x2="20.7" y2="8" />
                              <line x1="8.5" y1="14" x2="4.1" y2="6.4" />
                              <line x1="15.5" y1="14" x2="11.2" y2="21.5" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-[13px] font-bold text-outly-dark/70 group-hover:text-outly-accent transition duration-150">Chrome Extension</span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Apply faster from any job site.</span>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Right: Resources */}
                    <div className="col-span-5 border-l border-border pl-4 space-y-2.5">
                      <div className="text-[9px] font-extrabold text-muted-foreground/50 uppercase tracking-[0.15em] mb-1">Learning</div>
                      <div className="space-y-3.5 pt-1">
                        <button 
                          onClick={() => setActiveGuide("interview-prep")}
                          className="block text-[11.5px] font-semibold text-outly-dark/70 hover:text-outly-accent hover:translate-x-0.5 transition duration-200 text-left w-full"
                        >
                          Job Interview Guides
                        </button>
                        <button 
                          onClick={() => setActiveGuide("salary-negotiation")}
                          className="block text-[11.5px] font-semibold text-outly-dark/70 hover:text-outly-accent hover:translate-x-0.5 transition duration-200 text-left w-full"
                        >
                          Salary negotiation guide
                        </button>
                        <button 
                          onClick={() => setActiveGuide("linkedin-networking")}
                          className="block text-[11.5px] font-semibold text-outly-dark/70 hover:text-outly-accent hover:translate-x-0.5 transition duration-200 text-left w-full"
                        >
                          LinkedIn networking tactics
                        </button>
                        <button 
                          onClick={() => setActiveGuide("sprint-strategy")}
                          className="block text-[11.5px] font-semibold text-outly-dark/70 hover:text-outly-accent hover:translate-x-0.5 transition duration-200 text-left w-full"
                        >
                          Job search sprint strategy
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown 3: TOOLS */}
              <div 
                className="relative h-full flex items-center"
                onMouseEnter={() => openDropdown("tools")}
                onMouseLeave={scheduleDropdownClose}
              >
                <button 
                  type="button"
                  onClick={() => toggleDropdown("tools")}
                  className={`flex h-full items-center gap-1.5 border-b-2 text-[16px] font-medium leading-none tracking-normal transition-colors duration-200 ${
                    ["/cold-mail", "/linkedin-posts", "/twitter", "/logs", "/settings"].some(path => location.pathname.startsWith(path))
                      ? "border-primary text-primary" 
                      : "border-transparent text-outly-dark/70 hover:text-outly-accent"
                  }`}
                >
                  <span>Tools</span>
                  <ChevronDown className={`h-4 w-4 translate-y-px transition-transform duration-200 ${activeDropdown === "tools" ? "rotate-180 text-primary" : ""}`} />
                </button>

                {activeDropdown === "tools" && (
                  <div
                    className="absolute left-0 top-full z-50 grid w-[540px] grid-cols-12 gap-5 rounded-2xl border border-border bg-card p-5 shadow-xl animate-slide-up select-none"
                    onMouseEnter={() => openDropdown("tools")}
                    onMouseLeave={scheduleDropdownClose}
                  >
                    {/* Left: AI Outreach */}
                    <div className="col-span-7 space-y-2.5">
                      <div className="text-[9px] font-extrabold text-muted-foreground/50 uppercase tracking-[0.15em] mb-1 px-1">AI Outreach</div>
                      <div className="space-y-1">
                        <Link 
                          to="/cold-mail" 
                          className="flex items-center gap-4 rounded-xl p-2 hover:bg-muted/50 transition duration-155 group text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-outly-accent transition duration-150">
                            {/* Envelope (Cold Mail) */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-[13px] font-bold text-outly-dark/70 group-hover:text-outly-accent transition duration-150">Cold Mail Automation</span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Automate personalized emails to recruiters.</span>
                          </div>
                        </Link>
                        
                        <Link 
                          to="/linkedin-posts" 
                          className="flex items-center gap-4 rounded-xl p-2 hover:bg-muted/50 transition duration-155 group text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-outly-accent transition duration-150">
                            {/* LinkedIn Logo (filled) — Enhancv style */}
                            <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-[13px] font-bold text-outly-dark/70 group-hover:text-outly-accent transition duration-150">LinkedIn Post Generator</span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Draft professional content for personal branding.</span>
                          </div>
                        </Link>

                        <Link 
                          to="/twitter" 
                          className="flex items-center gap-4 rounded-xl p-2 hover:bg-muted/50 transition duration-155 group text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-outly-accent transition duration-150">
                            {/* Twitter / X Logo (filled) — Enhancv style */}
                            <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-[13px] font-bold text-outly-dark/70 group-hover:text-outly-accent transition duration-150">Twitter / X Scheduler</span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Automate and queue tweets and threads.</span>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Right: System & Settings */}
                    <div className="col-span-5 border-l border-border pl-4 space-y-2.5">
                      <div className="text-[9px] font-extrabold text-muted-foreground/50 uppercase tracking-[0.15em] mb-1">System &amp; Settings</div>
                      <div className="space-y-1 pt-1">
                        <Link 
                          to="/logs" 
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-muted/50 transition text-[11.5px] font-semibold text-outly-dark/70 hover:text-outly-accent text-left w-full group"
                        >
                          <ScrollText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-outly-accent" />
                          <span>System Logs</span>
                        </Link>
                        <Link 
                          to="/settings" 
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-muted/50 transition text-[11.5px] font-semibold text-outly-dark/70 hover:text-outly-accent text-left w-full group"
                        >
                          <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-outly-accent" />
                          <span>Workspace Settings</span>
                        </Link>
                        <Link 
                          to="/settings" 
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-muted/50 transition text-[11.5px] font-semibold text-outly-dark/70 hover:text-outly-accent text-left w-full group"
                        >
                          <KeyRound className="h-3.5 w-3.5 text-muted-foreground group-hover:text-outly-accent" />
                          <span>API Connections</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </nav>
          </div>

          {/* Right Side: Profile initials & Logout CTA */}
          <div className="flex items-center gap-4">
            
            {/* Desktop Profile Info */}
            <div className="hidden md:flex items-center gap-2.5 select-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-sm border border-primary/10">
                {initials}
              </div>
              <span className="text-[12px] font-bold text-foreground max-w-[100px] truncate">{fullName}</span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              type="button"
              className="hidden md:inline-flex items-center justify-center rounded-xl border border-border bg-card text-[11px] font-bold tracking-widest uppercase py-2 px-4 shadow-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition duration-200 gap-1.5"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground md:hidden shadow-sm"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

        </div>

        {/* ─── MOBILE RESPONSIVE NAVIGATION DRAWER ─── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-5 space-y-5 animate-slide-up shadow-inner select-none max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-center gap-3 border-b border-border pb-4 select-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {initials}
              </div>
              <div>
                <p className="font-bold text-sm text-foreground leading-none">{fullName}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Workspace Session Active</p>
              </div>
            </div>

            {/* Collapsible Accordion Menus */}
            <Accordion type="single" collapsible className="w-full space-y-1">
              
              {/* ACCORDION ITEM: RESUMES */}
              <AccordionItem value="resumes" className="border-b border-border/55">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
                  Resumes
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-1 space-y-2.5">
                  <Link to="/ats-score" className="flex items-center gap-3.5 rounded-xl bg-muted/20 border border-border/40 p-2.5 hover:bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="8 12 11 15 16 9" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-[11.5px] font-bold text-foreground">ATS Resume Checker</span>
                      <span className="block text-[9.5px] text-muted-foreground mt-0.5">Evaluate resume compatibility</span>
                    </div>
                  </Link>
                  <Link to="/resume-tailor" className="flex items-center gap-3.5 rounded-xl bg-muted/20 border border-border/40 p-2.5 hover:bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-[11.5px] font-bold text-foreground">Tailor Resume</span>
                      <span className="block text-[9.5px] text-muted-foreground mt-0.5">Tailor your CV for target jobs</span>
                    </div>
                  </Link>
                  <Link to="/resume-vault" className="flex items-center gap-3.5 rounded-xl bg-muted/20 border border-border/40 p-2.5 hover:bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-[11.5px] font-bold text-foreground">Resume Vault</span>
                      <span className="block text-[9.5px] text-muted-foreground mt-0.5">Manage saved resumes</span>
                    </div>
                  </Link>
                </AccordionContent>
              </AccordionItem>

              {/* ACCORDION ITEM: JOBS */}
              <AccordionItem value="jobs" className="border-b border-border/55">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
                  Jobs
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-1 space-y-2.5">
                  <Link to="/analytics" className="flex items-center gap-3.5 rounded-xl bg-muted/20 border border-border/40 p-2.5 hover:bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-[11.5px] font-bold text-foreground">Interview Help</span>
                      <span className="block text-[9.5px] text-muted-foreground mt-0.5">Practice with AI mock interviews</span>
                    </div>
                  </Link>
                  <Link to="/applications" className="flex items-center gap-3.5 rounded-xl bg-muted/20 border border-border/40 p-2.5 hover:bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-[11.5px] font-bold text-foreground">Job Tracker</span>
                      <span className="block text-[9.5px] text-muted-foreground mt-0.5">Visual Kanban pipeline</span>
                    </div>
                  </Link>
                  <Link to="/applications?tab=search" className="flex items-center gap-3.5 rounded-xl bg-muted/20 border border-border/40 p-2.5 hover:bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                        <line x1="9" y1="22" x2="9" y2="16" />
                        <line x1="9" y1="16" x2="15" y2="16" />
                        <line x1="15" y1="16" x2="15" y2="22" />
                        <line x1="9" y1="8" x2="9.01" y2="8" />
                        <line x1="15" y1="8" x2="15.01" y2="8" />
                        <line x1="9" y1="12" x2="9.01" y2="12" />
                        <line x1="15" y1="12" x2="15.01" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-[11.5px] font-bold text-foreground">Job Board</span>
                      <span className="block text-[9.5px] text-muted-foreground mt-0.5">Find matches and track</span>
                    </div>
                  </Link>
                  <Link to="/settings" className="flex items-center gap-3.5 rounded-xl bg-muted/20 border border-border/40 p-2.5 hover:bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="4" />
                        <line x1="12" y1="8" x2="20.7" y2="8" />
                        <line x1="8.5" y1="14" x2="4.1" y2="6.4" />
                        <line x1="15.5" y1="14" x2="11.2" y2="21.5" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-[11.5px] font-bold text-foreground">Chrome Extension</span>
                      <span className="block text-[9.5px] text-muted-foreground mt-0.5">Apply faster from any job site</span>
                    </div>
                  </Link>
                </AccordionContent>
              </AccordionItem>

              {/* ACCORDION ITEM: TOOLS */}
              <AccordionItem value="tools" className="border-b border-border/55">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
                  Tools
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-1 space-y-2.5">
                  <Link to="/cold-mail" className="flex items-center gap-3.5 rounded-xl bg-muted/20 border border-border/40 p-2.5 hover:bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-[11.5px] font-bold text-foreground">Cold Mail</span>
                      <span className="block text-[9.5px] text-muted-foreground mt-0.5">Automate email outreach</span>
                    </div>
                  </Link>
                  <Link to="/linkedin-posts" className="flex items-center gap-3.5 rounded-xl bg-muted/20 border border-border/40 p-2.5 hover:bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-[11.5px] font-bold text-foreground">LinkedIn Generator</span>
                      <span className="block text-[9.5px] text-muted-foreground mt-0.5">Draft professional content</span>
                    </div>
                  </Link>
                  <Link to="/twitter" className="flex items-center gap-3.5 rounded-xl bg-muted/20 border border-border/40 p-2.5 hover:bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-[11.5px] font-bold text-foreground">Twitter / X Scheduler</span>
                      <span className="block text-[9.5px] text-muted-foreground mt-0.5">Schedule automated tweets</span>
                    </div>
                  </Link>
                </AccordionContent>
              </AccordionItem>

              {/* ACCORDION ITEM: SYSTEM & SETTINGS */}
              <AccordionItem value="system" className="border-b-0">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
                  System &amp; Settings
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-1 space-y-2.5">
                  <Link to="/logs" className="flex items-center gap-3.5 rounded-xl bg-muted/20 border border-border/40 p-2.5 hover:bg-muted/50">
                    <ScrollText className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <span className="block text-[11.5px] font-bold text-foreground">System Logs</span>
                      <span className="block text-[9.5px] text-muted-foreground mt-0.5">Background worker status</span>
                    </div>
                  </Link>
                  <Link to="/settings" className="flex items-center gap-3.5 rounded-xl bg-muted/20 border border-border/40 p-2.5 hover:bg-muted/50">
                    <SettingsIcon className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <span className="block text-[11.5px] font-bold text-foreground">Workspace Settings</span>
                      <span className="block text-[9.5px] text-muted-foreground mt-0.5">Manage API keys and preferences</span>
                    </div>
                  </Link>
                </AccordionContent>
              </AccordionItem>

            </Accordion>

            <button
              onClick={handleLogout}
              type="button"
              className="w-full flex items-center justify-center rounded-xl bg-foreground text-background text-xs font-bold py-3.5 uppercase tracking-wider hover:bg-foreground/90 active:scale-[0.98] transition gap-2"
            >
              <LogOut className="h-4 w-4 text-primary" />
              Sign Out from Outly
            </button>
          </div>
        )}
      </header>

      {/* ─── MAIN CONTENT LAYOUT (FULL WIDTH) ─── */}
      <main className="flex-1 w-full flex flex-col min-h-0 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </main>

      {/* ─── INTERACTIVE EDUCATIONAL GUIDE DIALOG (ENHANCV STYLE) ─── */}
      <Dialog open={activeGuide !== null} onOpenChange={(open) => { if (!open) setActiveGuide(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[540px] border-outly-border bg-white rounded-2xl p-6 shadow-2xl select-none">
          {activeGuide && guidesData[activeGuide] && (
            <>
              <DialogHeader className="space-y-2 border-b border-outly-border pb-4 text-left">
                <DialogTitle className="text-xl font-bold text-outly-dark font-rubik leading-tight">
                  {guidesData[activeGuide].title}
                </DialogTitle>
                <DialogDescription className="text-xs text-outly-dark/50 font-medium">
                  {guidesData[activeGuide].description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 text-left">
                {guidesData[activeGuide].content}
              </div>

              <div className="border-t border-outly-border pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveGuide(null)}
                  className="rounded-xl bg-outly-accent text-white text-[11.5px] font-bold tracking-wider uppercase py-2.5 px-6 shadow-sm hover:bg-outly-accent/90 transition active:scale-95"
                >
                  Close Guide
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ─── HIGH-QUALITY CAREER GUIDES & LEARNING CONTENT ───
const guidesData: Record<string, { title: string; description: string; content: React.ReactNode }> = {
  "how-to-write": {
    title: "How to Write a Professional Resume",
    description: "Learn the foundational principles of writing a resume that secures interviews.",
    content: (
      <div className="space-y-4 text-xs text-outly-dark/75 leading-relaxed">
        <p className="font-bold text-[13px] text-outly-dark">1. Use the Reverse-Chronological Format</p>
        <p>List your work history starting with your most recent job and working backward. This is the format recruiters prefer and ATS systems parse most accurately.</p>
        <p className="font-bold text-[13px] text-outly-dark">2. Focus on Achievements, Not Just Duties</p>
        <p>Instead of listing responsibilities like "Responsible for managing a team," write "Led a cross-functional team of 6 engineers to launch our core product 2 weeks ahead of schedule." Use metrics wherever possible.</p>
        <p className="font-bold text-[13px] text-outly-dark">3. Start Bullets with Strong Action Verbs</p>
        <p>Begin each bullet point with powerful verbs like <em>Spearheaded</em>, <em>Optimized</em>, <em>Engineered</em>, or <em>Architected</em>. Avoid passive phrasing.</p>
      </div>
    )
  },
  "resume-format": {
    title: "Choosing the Right Resume Format",
    description: "Understand chronological, functional, and hybrid resume layouts.",
    content: (
      <div className="space-y-4 text-xs text-outly-dark/75 leading-relaxed">
        <p>Select a format that matches your career level and industry:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Reverse-Chronological:</strong> Best for candidates with a steady career path. Highlights progression and stability.</li>
          <li><strong>Functional (Skills-Based):</strong> Best for career changers or those with employment gaps. Focuses on transferrable skills rather than when/where they were acquired.</li>
          <li><strong>Hybrid (Combination):</strong> Best for experienced professionals. Features a prominent skills summary at the top, followed by chronological work history.</li>
        </ul>
      </div>
    )
  },
  "resume-summary": {
    title: "Writing a Compelling Resume Summary",
    description: "Hook recruiters in 6 seconds with a high-impact professional summary.",
    content: (
      <div className="space-y-4 text-xs text-outly-dark/75 leading-relaxed">
        <p>Your summary should sit at the very top of your resume and answer three questions: Who are you? What are your key achievements? What value do you bring?</p>
        <p className="border-l-4 border-outly-accent pl-3 italic bg-outly-cream p-3 rounded-r-xl text-[11px] leading-relaxed text-outly-dark/80">
          "Result-driven Software Engineer with 5+ years of experience building high-performance web applications. Spearheaded transition to microservices, reducing server response times by 40%. Proven track record of optimizing application performance and mentoring junior developers."
        </p>
        <p>Keep your summary concise—aim for 3 to 4 sentences or bullet points that highlight your most impressive qualifications.</p>
      </div>
    )
  },
  "one-page": {
    title: "Fitting Your Experience on One Page",
    description: "Strategies to keep your resume concise, dense, and impactful.",
    content: (
      <div className="space-y-4 text-xs text-outly-dark/75 leading-relaxed">
        <p className="font-bold text-[13px] text-outly-dark">1. The 10-Year Rule</p>
        <p>Only go back 10–15 years in your work history. Older experience is rarely relevant to modern roles and takes up valuable page space.</p>
        <p className="font-bold text-[13px] text-outly-dark">2. Maximize Whitespace and Margins</p>
        <p>Set your page margins to 0.5 inches (the minimum readable margin) and adjust line height to 1.15 to maximize text space without sacrificing readability.</p>
        <p className="font-bold text-[13px] text-outly-dark">3. Edit Ruthlessly</p>
        <p>Remove filler words. Combine short bullets. Ensure every single word on the page contributes directly to explaining why you are qualified for the target role.</p>
      </div>
    )
  },
  "interview-prep": {
    title: "Mastering the Behavioral Interview",
    description: "Use the STAR method to answer common behavioral and situational questions.",
    content: (
      <div className="space-y-4 text-xs text-outly-dark/75 leading-relaxed">
        <p>When asked questions like "Tell me about a time you resolved a conflict," structure your response using the <strong>STAR</strong> method:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Situation:</strong> Set the scene and provide necessary context. Keep it brief.</li>
          <li><strong>Task:</strong> Describe the challenge, goal, or problem you had to solve.</li>
          <li><strong>Action:</strong> Explain the specific actions <em>you</em> took to address the task. Highlight your individual contributions.</li>
          <li><strong>Result:</strong> Share the positive outcome of your actions. Use quantitative data (e.g., "resulting in a 15% increase in efficiency").</li>
        </ul>
      </div>
    )
  },
  "salary-negotiation": {
    title: "Salary Negotiation Masterclass",
    description: "Get paid what you are worth with proven negotiation strategies.",
    content: (
      <div className="space-y-4 text-xs text-outly-dark/75 leading-relaxed">
        <p className="font-bold text-[13px] text-outly-dark">1. Research Your Market Value</p>
        <p>Use sites like Glassdoor, Levels.fyi, and LinkedIn to find the typical compensation range for your role, experience level, and location before entering discussions.</p>
        <p className="font-bold text-[13px] text-outly-dark">2. Let the Employer Name the First Number</p>
        <p>When asked about salary expectations, defer: "I am flexible and open to a competitive offer that aligns with the responsibilities of the role. What range is budgeted for this position?"</p>
        <p className="font-bold text-[13px] text-outly-dark">3. Negotiate the Entire Package</p>
        <p>If the base salary is fixed, negotiate other elements like signing bonuses, stock options, remote work flexibility, or additional paid time off.</p>
      </div>
    )
  },
  "linkedin-networking": {
    title: "Networking on LinkedIn Effectively",
    description: "How to reach out to recruiters and hiring managers to secure referrals.",
    content: (
      <div className="space-y-4 text-xs text-outly-dark/75 leading-relaxed">
        <p className="font-bold text-[13px] text-outly-dark">1. Optimize Your Profile First</p>
        <p>Ensure your headline contains target keywords (e.g., "React Developer | TypeScript") and your About section tells a compelling story of your career journey.</p>
        <p className="font-bold text-[13px] text-outly-dark">2. Personalize Connection Requests</p>
        <p>Never send a blank connection request to someone in your target industry. Always include a brief note:</p>
        <p className="bg-outly-cream p-3 rounded-xl border border-[#e8e2d5] italic text-[11px] leading-relaxed text-outly-dark/80">
          "Hi [Name], I noticed your profile and love the work you are doing at [Company]. I am a Software Engineer specializing in React and would love to connect to follow your updates."
        </p>
        <p className="font-bold text-[13px] text-outly-dark">3. Ask for Advice, Not a Job</p>
        <p>When starting a conversation, ask for a brief informational interview: "I'd love to learn about your career path. Do you have 10 minutes for a quick virtual coffee next week?" People love sharing their stories.</p>
      </div>
    )
  },
  "sprint-strategy": {
    title: "Job Search Sprint Strategy",
    description: "Organize your job search to maximize results and minimize burnout.",
    content: (
      <div className="space-y-4 text-xs text-outly-dark/75 leading-relaxed">
        <p>Treat your job search like a software sprint. Plan your week into distinct, manageable blocks:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Monday (Sourcing):</strong> Find and list 10 target roles in your Job Tracker. Do not apply yet.</li>
          <li><strong>Tuesday &amp; Wednesday (Tailoring &amp; Submitting):</strong> Use the AI Resume Builder to tailor your resume and submit applications. Aim for quality over quantity.</li>
          <li><strong>Thursday (Outreach):</strong> Send personalized cold emails or LinkedIn messages to recruiters at your target companies.</li>
          <li><strong>Friday (Follow-ups &amp; Upskilling):</strong> Follow up on pending applications and practice interview questions.</li>
        </ul>
      </div>
    )
  }
};
