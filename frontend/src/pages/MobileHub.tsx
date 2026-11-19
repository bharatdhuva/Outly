import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { m } from "motion/react";
import { api } from "@/lib/api";
import PageSkeleton from "@/components/PageSkeleton";
import { 
  FileCheck, 
  Sparkles, 
  FolderArchive, 
  Search, 
  Briefcase, 
  Mail, 
  Calendar 
} from "lucide-react";

const AtsScore = lazy(() => import("./AtsScore"));
const ResumeTailor = lazy(() => import("./ResumeTailor"));
const ResumeVault = lazy(() => import("./ResumeVault"));
const Applications = lazy(() => import("./Applications"));
const JobSearch = lazy(() => import("./JobSearch"));
const ColdMail = lazy(() => import("./ColdMail"));

interface MobileHubProps {
  category: "resumes" | "jobs" | "tools";
}

export default function MobileHub({ category }: MobileHubProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const { data: apps = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: api.applications.list,
    enabled: category === "jobs",
  });
  const jobsCount = apps.length;

  const tabs = {
    resumes: [
      { id: "ats", label: "ATS Score", shortLabel: "ATS Score", icon: FileCheck },
      { id: "tailor", label: "Tailor Resume", shortLabel: "Tailor", icon: Sparkles },
      { id: "vault", label: "Resume Vault", shortLabel: "Vault", icon: FolderArchive },
    ],
    jobs: [
      { id: "search", label: "Job Search", shortLabel: "Search", icon: Search },
      { id: "tracker", label: "Job Tracker", shortLabel: "Tracker", icon: Briefcase },
    ],
    tools: [
      { id: "mail", label: "Cold Mail", shortLabel: "Cold Mail", icon: Mail },
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
    <div className="flex-1 min-h-0 w-full flex flex-col font-sans text-outly-dark text-left bg-transparent">
      {/* Modern Segmented Sub Selector */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-black/[0.06] px-3 sm:px-6 py-2 select-none shadow-xs">
        <div className="w-full max-w-lg mx-auto">
          <div className={`grid gap-1 bg-[#F1F1EF] p-1 rounded-xl ${
            tabs.length === 3 ? "grid-cols-3" : tabs.length === 2 ? "grid-cols-2" : "grid-cols-1"
          }`}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const showBadge = category === "jobs" && tab.id === "tracker" && jobsCount > 0;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative py-1.5 sm:py-2 px-1.5 rounded-lg text-[11.5px] sm:text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer outline-none select-none active:scale-[0.98] ${
                    isActive
                      ? "bg-white text-[#111111] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                      : "text-[#666666] hover:text-[#111111]"
                  }`}
                >
                  {Icon && (
                    <Icon className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                      isActive ? "text-[#12A394]" : "text-[#777777]"
                    }`} />
                  )}
                  <span className="truncate">
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
                  </span>
                  {showBadge && (
                    <span className="flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white leading-none">
                      {jobsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 w-full min-h-0 max-w-full overflow-x-hidden">
        <Suspense fallback={<PageSkeleton />}>
          <m.div
            key={`${category}-${activeTab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            {category === "resumes" && activeTab === "ats" && <AtsScore />}
            {category === "resumes" && activeTab === "tailor" && <ResumeTailor />}
            {category === "resumes" && activeTab === "vault" && <ResumeVault />}

            {category === "jobs" && activeTab === "tracker" && <Applications />}
            {category === "jobs" && activeTab === "search" && <JobSearch />}

            {category === "tools" && activeTab === "mail" && <ColdMail />}
          </m.div>
        </Suspense>
      </div>
    </div>
  );
}

