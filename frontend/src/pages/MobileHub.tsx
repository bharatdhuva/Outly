import { useEffect, useState } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  FileCheck, 
  Sparkles, 
  Database, 
  Search, 
  Briefcase, 
  Mail, 
  Calendar 
} from "lucide-react";

import AtsScore from "./AtsScore";
import ResumeTailor from "./ResumeTailor";
import ResumeVault from "./ResumeVault";
import Applications from "./Applications";
import JobSearch from "./JobSearch";
import ColdMail from "./ColdMail";
import ContentScheduler from "./ContentScheduler";

interface MobileHubProps {
  category: "resumes" | "jobs" | "tools";
}

export default function MobileHub({ category }: MobileHubProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: apps = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: api.applications.list,
    enabled: category === "jobs",
  });
  const jobsCount = apps.length;

  const tabs = {
    resumes: [
      { id: "ats", label: "ATS Score", icon: FileCheck },
      { id: "tailor", label: "Tailor Resume", icon: Sparkles },
      { id: "vault", label: "Resume Vault", icon: Database },
    ],
    jobs: [
      { id: "search", label: "Job Search", icon: Search },
      { id: "tracker", label: "Job Tracker", icon: Briefcase },
    ],
    tools: [
      { id: "mail", label: "Cold Mail", icon: Mail },
      { id: "scheduler", label: "Scheduler", icon: Calendar },
    ],
  }[category];

  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(() => {
    const matched = tabs.find((t) => t.id === tabParam);
    return matched ? matched.id : tabs[0].id;
  });

  // Sync active tab on URL search param or category changes
  useEffect(() => {
    const matched = tabs.find((t) => t.id === tabParam);
    setActiveTab(matched ? matched.id : tabs[0].id);
  }, [category, tabParam]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/${category}?tab=${tabId}`, { replace: true });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set page title
  useEffect(() => {
    const activeLabel = tabs.find(t => t.id === activeTab)?.label || "Hub";
    document.title = `Outly - ${activeLabel}`;
  }, [activeTab, tabs]);

  // Handle redirects to desktop versions
  if (!isMobile) {
    const redirects = {
      resumes: "/resume-vault",
      jobs: "/applications",
      tools: "/cold-mail",
    };
    return <Navigate to={redirects[category]} replace />;
  }

  return (
    <div className="relative flex-1 min-h-[calc(100vh-8rem)] w-full flex flex-col font-sans text-outly-dark animate-fade-in text-left bg-transparent">
      {/* Tab bar header */}
      <div className={`sticky z-30 bg-[#FAF6EE]/85 backdrop-blur-md border-b border-[#e8e2d5]/60 px-6 pt-3 select-none shadow-xs transition-[top] duration-150 ease-out ${scrolled ? "top-11" : "top-16"}`}>
        <div className="relative w-full overflow-hidden">
          <div 
            className="flex gap-6 overflow-x-auto -mx-6 px-6 scrollbar-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const showBadge = category === "jobs" && tab.id === "tracker" && jobsCount > 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative pb-3 pt-1 text-[11px] font-bold uppercase tracking-wider transition-all duration-155 cursor-pointer outline-none shrink-0 flex items-center gap-1.5 ${
                    isActive ? "text-[#f23c5d]" : "text-zinc-400/80 hover:text-zinc-600"
                  }`}
                >
                  {tab.icon && <tab.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#f23c5d]" : "text-zinc-400/60"}`} />}
                  <span>{tab.label}</span>
                  {showBadge && (
                    <span className="flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white leading-none scale-90 translate-y-[-1px]">
                      {jobsCount}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#f23c5d] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
          {/* Fade gradient on the right edge */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FAF6EE] to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 w-full min-h-0 overflow-y-auto">
        {category === "resumes" && activeTab === "ats" && <AtsScore />}
        {category === "resumes" && activeTab === "tailor" && <ResumeTailor />}
        {category === "resumes" && activeTab === "vault" && <ResumeVault />}

        {category === "jobs" && activeTab === "tracker" && <Applications />}
        {category === "jobs" && activeTab === "search" && <JobSearch />}

        {category === "tools" && activeTab === "mail" && <ColdMail />}
        {category === "tools" && activeTab === "scheduler" && <ContentScheduler />}
      </div>
    </div>
  );
}
