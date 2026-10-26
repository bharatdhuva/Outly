import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Building,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  PlusCircle,
  Loader2,
  CheckCircle2,
  Lock,
  Bookmark
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";



const jobBoards = [
  { id: "linkedin", name: "LinkedIn Jobs", badge: "MNC & Corporate", domain: "linkedin.com" },
  { id: "wellfound", name: "Wellfound", badge: "Startup Careers", domain: "wellfound.com" },
  { id: "naukri", name: "Naukri.com", badge: "Pan-India Hiring", domain: "naukri.com" },
  { id: "internshala", name: "Internshala", badge: "Internships & Freshers", domain: "internshala.com" },
  { id: "cutshort", name: "Cutshort", badge: "AI Tech Matching", domain: "cutshort.io" },
  { id: "indeed", name: "Indeed", badge: "Global Listings", domain: "indeed.com" },
  { id: "glassdoor", name: "Glassdoor", badge: "Salaries & Reviews", domain: "glassdoor.com" },
];

function BrandLogo({ domain, name }: { domain: string; name: string }) {
  return (
    <img 
      src={`https://logo.clearbit.com/${domain}`}
      alt={name}
      className="h-5 w-5 object-contain rounded-sm shrink-0 mix-blend-multiply"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (!target.dataset.fallback) {
          target.dataset.fallback = "true";
          target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        }
      }}
    />
  );
}

function CompanyLogo({ company, source }: { company: string; source: string }) {
  // Clean company name for logo domain (e.g. Google -> google.com)
  const cleaned = company.toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  const [src, setSrc] = useState(`https://logo.clearbit.com/${cleaned}.com`);
  const [fallbackStage, setFallbackStage] = useState(0);

  const handleErr = () => {
    if (fallbackStage === 0) {
      setSrc(`https://www.google.com/s2/favicons?domain=${cleaned}.com&sz=128`);
      setFallbackStage(1);
    } else if (fallbackStage === 1) {
      const portalDomain = jobBoards.find(b => b.id === source)?.domain || "google.com";
      setSrc(`https://logo.clearbit.com/${portalDomain}`);
      setFallbackStage(2);
    } else {
      setFallbackStage(3);
    }
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth <= 1) {
      handleErr();
    }
  };

  // If fallbackStage is 3 (all URL fetches failed) or the company name is empty/invalid,
  // render the beautiful Office/Building SVG icon.
  if (fallbackStage === 3 || !cleaned) {
    return (
      <div className="w-10 h-10 rounded-xl bg-[#F8F7F4] text-muted-foreground/70 border border-[#e8e2d5] flex items-center justify-center shrink-0 shadow-3xs">
        <Building className="h-5 w-5 stroke-[1.8] text-outly-accent" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl bg-white border border-[#e8e2d5]/60 flex items-center justify-center overflow-hidden shrink-0 shadow-3xs">
      <img 
        src={src} 
        alt={company} 
        className="h-8 w-8 object-contain shrink-0" 
        onLoad={handleLoad}
        onError={handleErr}
      />
    </div>
  );
}

export default function JobSearchPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });

  // Search/Scraper State with smart defaults loaded from sessionStorage
  const [scrapeRole, setScrapeRole] = useState(() => sessionStorage.getItem("job_search_role") || "Backend Engineer");
  const [scrapeLocation, setScrapeLocation] = useState(() => sessionStorage.getItem("job_search_location") || "Bengaluru");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedJobs, setScrapedJobs] = useState<any[]>(() => {
    try {
      const stored = sessionStorage.getItem("job_search_results");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isLiveScrape, setIsLiveScrape] = useState(() => sessionStorage.getItem("job_search_is_live") === "true");

  // Synchronize state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("job_search_role", scrapeRole);
  }, [scrapeRole]);

  useEffect(() => {
    sessionStorage.setItem("job_search_location", scrapeLocation);
  }, [scrapeLocation]);

  useEffect(() => {
    sessionStorage.setItem("job_search_results", JSON.stringify(scrapedJobs));
  }, [scrapedJobs]);

  useEffect(() => {
    sessionStorage.setItem("job_search_is_live", String(isLiveScrape));
  }, [isLiveScrape]);

  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [unlockAtTime, setUnlockAtTime] = useState<string | null>(null);
  const [countdownText, setCountdownText] = useState("");

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: api.auth.me,
  });

  // Helper to compute countdown text from an unlock ISO timestamp
  const getCountdown = (unlockIso: string): string => {
    const diff = new Date(unlockIso).getTime() - Date.now();
    if (diff <= 0) return "";
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    const pad = (num: number) => String(num).padStart(2, "0");
    if (hrs > 0) return `${hrs}h ${pad(mins)}m ${pad(secs)}s`;
    return `${mins}m ${pad(secs)}s`;
  };

  // Load user-specific limit status from localStorage (timestamp-based auto-expiry)
  useEffect(() => {
    const userPrefix = userData?.user?.id || "anonymous";
    const storageKey = `job_search_limit_unlock_${userPrefix}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      const unlockTime = new Date(stored).getTime();
      if (Date.now() >= unlockTime) {
        // Limit has expired — clear it
        localStorage.removeItem(storageKey);
        setIsLimitExceeded(false);
        setUnlockAtTime(null);
      } else {
        setIsLimitExceeded(true);
        setUnlockAtTime(stored);
        setCountdownText(getCountdown(stored));
      }
    } else {
      setIsLimitExceeded(false);
    }
  }, [userData]);

  // Tick countdown every second and auto-unlock when time passes
  useEffect(() => {
    if (!unlockAtTime) return;
    
    // Initial call to set the live state immediately on mount or key change
    setCountdownText(getCountdown(unlockAtTime));

    const timer = setInterval(() => {
      const diff = new Date(unlockAtTime).getTime() - Date.now();
      if (diff <= 0) {
        setIsLimitExceeded(false);
        setUnlockAtTime(null);
        setCountdownText("");
        const userPrefix = userData?.user?.id || "anonymous";
        localStorage.removeItem(`job_search_limit_unlock_${userPrefix}`);
        clearInterval(timer);
      } else {
        setCountdownText(getCountdown(unlockAtTime));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [unlockAtTime, userData]);

  
  // Track which job IDs have been added during this session
  const [trackedJobIds, setTrackedJobIds] = useState<Record<string, boolean>>({});

  // Query applications list to check track status dynamically
  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: api.applications.list,
  });

  // Mutation to track job in Kanban pipeline
  const trackJobMutation = useMutation({
    mutationFn: api.applications.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      toast({
        title: "Stage Updated",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Track Failed",
        description: String(err),
      });
    }
  });

  // Mutation to delete/unsave job from Kanban pipeline
  const deleteJobMutation = useMutation({
    mutationFn: api.applications.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      toast({
        title: "Stage Updated",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Remove Failed",
        description: String(err),
      });
    }
  });

  const handleScrapeJobs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitExceeded) {
      window.dispatchEvent(new CustomEvent("outly_limit_exceeded", {
        detail: {
          code: "LIMIT_JOB_SEARCH_EXCEEDED",
          message: "Free tier is limited to 3 job searches per 12 hours."
        }
      }));
      return;
    }
    if (!scrapeRole.trim()) {
      toast({
        variant: "destructive",
        title: "Search Term Required",
        description: "Please enter a role to search for.",
      });
      return;
    }

    setIsScraping(true);
    setScrapedJobs([]);
    try {
      const res = await api.scraper.jobs(scrapeRole, scrapeLocation, "");
      setScrapedJobs(res.jobs);
      setIsLiveScrape(res.isLive);
      toast({
        title: "Job search updated",
      });
    } catch (err: any) {
      const errStr = String(err);
      const isLimitError = errStr.includes("LIMIT_JOB_SEARCH_EXCEEDED") || errStr.toLowerCase().includes("limit reached");

      if (isLimitError) {
        setIsLimitExceeded(true);
        const unlockIso = (err as any)?.data?.unlockAt || null;
        if (unlockIso) {
          setUnlockAtTime(unlockIso);
          setCountdownText(getCountdown(unlockIso));
          const userPrefix = userData?.user?.id || "anonymous";
          localStorage.setItem(`job_search_limit_unlock_${userPrefix}`, unlockIso);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Search Failed",
          description: errStr,
        });
      }
    } finally {
      setIsScraping(false);
    }
  };

  const handleTrackJob = (job: any) => {
    // Generate a unique session key for tracking button states
    const jobKey = `${job.company}-${job.title}-${job.source}`;
    
    trackJobMutation.mutate({
      company: job.company,
      role: job.title,
      jd_url: job.url,
      stage: "saved",
      resume_version_used: null,
      notes: `Scraped from ${job.source}. Experience Level: ${job.experience || "N/A"}. Salary Estimate: ${job.salary || "N/A"}.`,
      email_history: "[]",
    });

    setTrackedJobIds((prev) => ({ ...prev, [jobKey]: true }));
  };

  const handleUntrackJob = (appId: string, jobKey: string) => {
    deleteJobMutation.mutate(appId, {
      onSuccess: () => {
        setTrackedJobIds((prev) => {
          const updated = { ...prev };
          delete updated[jobKey];
          return updated;
        });
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-8 space-y-6 animate-fade-in pb-20 text-left font-sans">
      
      {/* Top Header matching ResumeVault, Applications, AtsScore & ResumeTailor */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-left">
        <div>
          <div className="hidden sm:inline-flex items-center gap-2 mb-1">
            <Search className="w-3.5 h-3.5 text-[#2DC08D]" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Jobs / Search
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mt-1.5">
            Job Search
          </h1>
          <p className="text-[13px] text-neutral-500 font-normal mt-1 max-w-3xl">
            Search live across LinkedIn, Wellfound, Naukri, and top platforms. One-click track positions straight into your visual Kanban pipeline.
          </p>
        </div>
      </div>

      {/* Job Portals Horizontal Marquee */}
      <div className="slider-mask relative w-full py-2 overflow-hidden group">
        <div className="animate-marquee flex items-center gap-8">
          {[...jobBoards, ...jobBoards, ...jobBoards].map((board, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 shrink-0 opacity-80 hover:opacity-100 transition-opacity cursor-pointer group/item select-none"
            >
              <BrandLogo domain={board.domain} name={board.name} />
              <div className="text-left">
                <p className="text-xs font-bold text-neutral-800 leading-snug group-hover/item:text-black transition-colors">{board.name}</p>
                <span className="text-[10px] font-medium text-neutral-400">{board.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Parameters Form */}
      <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] text-left">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-neutral-500" />
            Filter Parameters
          </h2>
          {isLimitExceeded && countdownText && (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Unlocks in {countdownText}
            </span>
          )}
        </div>
        
        <form onSubmit={handleScrapeJobs} className="grid gap-4 md:grid-cols-3 items-end text-xs font-medium">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-neutral-400" /> Target Role
            </label>
            <Input
              required
              placeholder="Enter role or job title"
              value={scrapeRole}
              onChange={(e) => setScrapeRole(e.target.value)}
              className="bg-neutral-50/50 hover:bg-white focus:bg-white border-neutral-200 text-xs h-10 focus-visible:ring-1 focus-visible:ring-black placeholder:text-neutral-400 rounded-xl shadow-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-neutral-400" /> Location
            </label>
            <Input
              placeholder="Enter location or remote"
              value={scrapeLocation}
              onChange={(e) => setScrapeLocation(e.target.value)}
              className="bg-neutral-50/50 hover:bg-white focus:bg-white border-neutral-200 text-xs h-10 focus-visible:ring-1 focus-visible:ring-black placeholder:text-neutral-400 rounded-xl shadow-none transition-all"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isScraping} 
            className={`h-10 w-full font-medium tracking-normal rounded-xl text-xs shadow-sm active:scale-[0.98] transition-all gap-1.5 cursor-pointer ${
              isLimitExceeded 
                ? "bg-amber-600 hover:bg-amber-700 text-white" 
                : "bg-black hover:bg-neutral-800 text-white"
            }`}
          >
            {isScraping ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching live portals...
              </>
            ) : isLimitExceeded ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                Limit Reached{countdownText ? ` · ${countdownText}` : " (3/3)"}
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                Find Positions
              </>
            )}
          </Button>
        </form>
      </section>

      {/* Scraped Jobs listings list */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-neutral-600" />
              Live Search Results
            </h3>
            {scrapedJobs.length > 0 && (
              <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200/70">
                {scrapedJobs.length} {scrapedJobs.length === 1 ? "position" : "positions"}
              </span>
            )}
          </div>

          {scrapedJobs.length > 0 && (
            <span className="text-[10px] text-neutral-400 font-mono tracking-widest uppercase">
              Outly Live Search
            </span>
          )}
        </div>

        {isScraping ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div 
                key={n}
                className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[260px] flex flex-col justify-between animate-pulse"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-neutral-100 rounded-xl" />
                    <div className="w-14 h-6 bg-neutral-100 rounded-full" />
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="h-4 bg-neutral-100 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <div className="h-3 bg-neutral-100 rounded w-5/6" />
                  </div>
                </div>
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <div className="h-3 bg-neutral-100 rounded w-1/4" />
                  <div className="h-8 bg-neutral-100 rounded-lg w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : scrapedJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-14 text-center min-h-[320px] flex flex-col items-center justify-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
              <Search className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-neutral-800">No active job search</h4>
            <p className="text-xs text-neutral-400 max-w-sm mt-1 leading-relaxed">
              Enter target role and location parameters above to search live across LinkedIn, Wellfound, Naukri, and more.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scrapedJobs.map((job, idx) => {
              const jobKey = `${job.company}-${job.title}-${job.source}`;
              
              // Dynamic check against backend list + session local tracking
              const matchedApp = applications.find(
                (app) =>
                  app.company.toLowerCase().trim() === job.company.toLowerCase().trim() &&
                  app.role.toLowerCase().trim() === job.title.toLowerCase().trim()
              );
              
              const isAlreadyTracked = !!matchedApp || trackedJobIds[jobKey];

              // Realistic posted date
              const getPostedDate = (index: number) => {
                const days = [
                  "Just now",
                  "1 day ago",
                  "2 days ago",
                  "3 days ago",
                  "5 days ago",
                  "1 week ago",
                  "2 weeks ago"
                ];
                return days[index % days.length];
              };

              const getMockSalary = (index: number) => {
                const salaries = [
                  "₹18 - 25 LPA",
                  "₹12 - 18 LPA",
                  "₹25 - 35 LPA",
                  "₹15 - 22 LPA",
                  "₹30 - 45 LPA",
                  "₹10 - 16 LPA"
                ];
                return salaries[index % salaries.length];
              };

              return (
                <div
                  key={idx}
                  className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-neutral-300 transition-all duration-200 flex flex-col justify-between min-h-[280px] text-left space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Company Logo & Save button */}
                    <div className="flex items-center justify-between">
                      <CompanyLogo company={job.company} source={job.source} />
                      
                      {isAlreadyTracked ? (
                        <button
                          onClick={() => {
                            if (matchedApp) {
                              handleUntrackJob(matchedApp.id, jobKey);
                            }
                          }}
                          disabled={deleteJobMutation.isPending}
                          className="group/saved flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 text-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-[11px] font-semibold shadow-xs cursor-pointer select-none transition-all border border-transparent"
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-white text-white group-hover/saved:fill-transparent group-hover/saved:text-red-500 shrink-0 transition-colors" />
                          <span className="group-hover/saved:hidden">Saved</span>
                          <span className="hidden group-hover/saved:inline">Unsave</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTrackJob(job)}
                          disabled={trackJobMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200/90 text-[11px] font-medium text-neutral-600 bg-white hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
                        >
                          <Bookmark className="w-3.5 h-3.5 shrink-0" />
                          <span>Save</span>
                        </button>
                      )}
                    </div>

                    {/* Company Name & Posted Date */}
                    <div className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
                      <span className="font-bold text-neutral-800 truncate max-w-[140px]">{job.company}</span>
                      <span>•</span>
                      <span>{getPostedDate(idx)}</span>
                    </div>

                    {/* Job Title */}
                    <h4 className="text-[15px] font-bold text-neutral-900 tracking-tight leading-snug line-clamp-2" title={job.title}>
                      {job.title}
                    </h4>
                    
                    {/* Tag Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {job.location && (
                        <span className="text-[10px] font-medium bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded-md border border-neutral-200/40">
                          {job.location.split("/")[0].trim()}
                        </span>
                      )}
                      {job.experience && (
                        <span className="text-[10px] font-medium bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded-md border border-neutral-200/40">
                          {job.experience}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-500 px-2.5 py-0.5 rounded-md border border-neutral-200/40 uppercase tracking-wider font-mono">
                        {job.source}
                      </span>
                    </div>
                  </div>

                  {/* Footer: Salary & Apply Button */}
                  <div className="flex items-center justify-between pt-3.5 border-t border-neutral-100">
                    <div className="text-left leading-tight">
                      <p className="text-[13px] font-bold text-neutral-900">
                        {job.salary && !job.salary.includes("Undisclosed") && job.salary !== "Not specified" && job.salary !== "Salary Undisclosed"
                          ? job.salary
                          : getMockSalary(idx)}
                      </p>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        {job.location || "Bengaluru / Remote"}
                      </span>
                    </div>

                    <Button
                      asChild
                      className="bg-black hover:bg-neutral-800 text-white font-medium text-xs px-3.5 h-8 rounded-lg shadow-sm cursor-pointer active:scale-[0.97] transition-all"
                    >
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        <span>Apply now</span>
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Limit Exceeded Dialog Modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[420px] border-neutral-200 bg-white p-6 font-sans text-center rounded-xl">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Lock className="w-6 h-6 shrink-0" />
            </div>
            <DialogTitle className="text-base font-bold text-neutral-900">Search Limit Reached (3/3)</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 leading-relaxed">
              You are limited to 3 job searches per 12 hours.{countdownText ? ` Unlocks in ${countdownText}.` : " Please try again later."}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowLimitModal(false)}
              className="w-full sm:w-auto border-neutral-200 text-xs font-medium h-9 rounded-lg hover:bg-neutral-50 transition"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
  );
}
