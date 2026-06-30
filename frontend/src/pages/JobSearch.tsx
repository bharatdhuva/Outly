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
  Lock
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

import LockedFeatureGuard from "@/components/LockedFeatureGuard";

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
      className="h-5 w-5 object-contain rounded-sm shrink-0"
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

export default function JobSearchPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });

  // Search/Scraper State with smart defaults
  const [scrapeRole, setScrapeRole] = useState("Backend Engineer");
  const [scrapeLocation, setScrapeLocation] = useState("Bengaluru");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedJobs, setScrapedJobs] = useState<any[]>([]);
  const [isLiveScrape, setIsLiveScrape] = useState(false);

  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: api.auth.me,
  });

  // Load user-specific daily limit status from localStorage
  useEffect(() => {
    const userPrefix = userData?.user?.id || "anonymous";
    const storageKey = `job_search_limit_reached_${userPrefix}`;
    const isLocked = localStorage.getItem(storageKey) === "true";
    setIsLimitExceeded(isLocked);
  }, [userData]);

  
  // Track which job IDs have been added during this session
  const [trackedJobIds, setTrackedJobIds] = useState<Record<string, boolean>>({});

  // Mutation to track job in Kanban pipeline
  const trackJobMutation = useMutation({
    mutationFn: api.applications.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      toast({
        title: "Added to Tracker",
        description: `Successfully added ${variables.role} at ${variables.company} under "Saved".`,
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

  const handleScrapeJobs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitExceeded) {
      setShowLimitModal(true);
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
    try {
      const res = await api.scraper.jobs(scrapeRole, scrapeLocation, "");
      setScrapedJobs(res.jobs);
      setIsLiveScrape(res.isLive);
      toast({
        title: "Search Complete",
        description: `Found ${res.jobs.length} relevant listings from top boards.`,
      });
    } catch (err: any) {
      const errStr = String(err);
      const isLimitError = errStr.includes("LIMIT_JOB_SEARCH_EXCEEDED") || errStr.toLowerCase().includes("limit reached");

      if (isLimitError) {
        setIsLimitExceeded(true);
        setShowLimitModal(true);
        const userPrefix = userData?.user?.id || "anonymous";
        localStorage.setItem(`job_search_limit_reached_${userPrefix}`, "true");
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

  return (
    <LockedFeatureGuard featureTitle="Job Search Engine">
      <div className="mx-auto w-full max-w-7xl px-6 py-6 sm:px-8 space-y-8 animate-fade-in pb-16">
      
      {/* Hero Header */}
      <div className="space-y-3 text-left">
        <span className="text-xs font-extrabold tracking-[0.2em] text-outly-accent uppercase bg-outly-accent/5 px-3 py-1.5 rounded-full inline-block">
          JOB SEARCH
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
          Smart Job Search & Auto Apply Platform
        </h1>
        <p className="text-muted-foreground text-[13px] sm:text-[14px] leading-relaxed max-w-3xl">
          Search across major job portals like LinkedIn, Wellfound, Internshala, and Naukri. One-click track listings straight into your Kanban pipeline.
        </p>

        {/* Job Portals Horizontal Marquee Carousel */}
        <div className="slider-mask relative w-full py-4 my-2 group">
          <div className="animate-marquee flex items-center gap-8">
            {[...jobBoards, ...jobBoards, ...jobBoards].map((board, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 shrink-0 opacity-85 hover:opacity-100 transition-all duration-200 cursor-pointer group/item"
              >
                <BrandLogo domain={board.domain} name={board.name} />
                <div className="text-left">
                  <p className="text-xs font-bold text-foreground leading-snug group-hover/item:text-primary transition-colors">{board.name}</p>
                  <span className="text-[10px] font-medium text-muted-foreground">{board.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scraper Parameters Input Form */}
      <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)] text-left">
        <h2 className="text-[13px] font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Search className="h-4.5 w-4.5 text-outly-accent" />
          Filter Parameters
        </h2>
        
        <form onSubmit={handleScrapeJobs} className="grid gap-4 md:grid-cols-3 items-end text-xs font-medium">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-primary" /> Target Role
            </label>
            <Input
              required
              placeholder="e.g. React Developer"
              value={scrapeRole}
              onChange={(e) => setScrapeRole(e.target.value)}
              className="bg-white border-border text-xs h-9 focus-visible:ring-primary placeholder:text-muted-foreground/60 rounded-lg shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Location
            </label>
            <Input
              placeholder="e.g. Bengaluru / Remote"
              value={scrapeLocation}
              onChange={(e) => setScrapeLocation(e.target.value)}
              className="bg-white border-border text-xs h-9 focus-visible:ring-primary placeholder:text-muted-foreground/60 rounded-lg shadow-sm"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isScraping} 
            className={`h-9 w-full font-bold tracking-wide rounded-lg uppercase shadow-sm active:scale-[0.98] transition-all gap-1.5 ${
              isLimitExceeded 
                ? "bg-amber-500 hover:bg-amber-500/90 text-white" 
                : "bg-outly-accent hover:bg-outly-accent/90 text-white"
            }`}
          >
            {isScraping ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching...
              </>
            ) : isLimitExceeded ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                Limit Reached (3/3)
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
          <h3 className="text-[14px] font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-4.5 w-4.5 text-primary" />
            Live Search Results
          </h3>
          {scrapedJobs.length > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono bg-secondary/80 px-2.5 py-0.5 rounded-full border border-border">
              {isLiveScrape ? "Outly Live Job search" : "Outly Live Job search"}
            </span>
          )}
        </div>

        {scrapedJobs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-muted-foreground min-h-[300px] flex flex-col items-center justify-center shadow-[var(--shadow-card)]">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4 animate-pulse">
              <Search className="h-6 w-6" />
            </div>
            <h4 className="text-[14px] font-bold text-foreground">No search criteria active</h4>
            <p className="text-[11px] text-muted-foreground max-w-sm mt-1 leading-relaxed">
              Enter target role parameters above and search across major portals.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {scrapedJobs.map((job, idx) => {
              const jobKey = `${job.company}-${job.title}-${job.source}`;
              const isAlreadyTracked = trackedJobIds[jobKey];

              return (
                <div
                  key={idx}
                  className="bg-card border border-border rounded-lg p-5 shadow-[var(--shadow-card)] hover:border-primary/25 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[210px] text-left animate-pop-in space-y-4"
                >
                  <div className="space-y-3">
                    {/* Card Header: Company & Portal Source */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5 truncate max-w-[140px]" title={job.company}>
                        <Building className="h-3.5 w-3.5 text-outly-accent shrink-0" />
                        {job.company}
                      </span>
                      <span className="px-2 py-0.5 rounded border border-border bg-secondary/40 font-mono text-[9px] uppercase tracking-wider">
                        {job.source}
                      </span>
                    </div>

                    {/* Job Title */}
                    <h4 className="text-[13px] font-bold text-foreground line-clamp-2 leading-snug" title={job.title}>
                      {job.title}
                    </h4>
                    
                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="inline-flex items-center gap-1 text-[9.5px] bg-secondary/40 text-muted-foreground px-2 py-0.5 rounded border border-border/40 font-medium">
                        <MapPin className="w-2.5 h-2.5 shrink-0 text-muted-foreground/70" />
                        {job.location || "Location N/A"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9.5px] bg-secondary/40 text-muted-foreground px-2 py-0.5 rounded border border-border/40 font-medium">
                        <Clock className="w-2.5 h-2.5 shrink-0 text-muted-foreground/70" />
                        {job.experience || "Req. Exp N/A"}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded border font-medium ${
                        job.salary && !job.salary.includes("Undisclosed") && job.salary !== "Not specified"
                          ? "bg-success/10 text-success border-success/20 font-bold"
                          : "bg-secondary/30 text-muted-foreground/70 border-border/40"
                      }`}>
                        <DollarSign className="w-2.5 h-2.5 shrink-0" />
                        {job.salary || "Salary Undisclosed"}
                      </span>
                    </div>

                    {/* Required Skills / Qualifications tags */}
                    {Array.isArray(job.skills) && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-border/20">
                        {job.skills.map((skill: string, sIdx: number) => (
                          <span key={sIdx} className="text-[9px] bg-primary/5 text-primary border border-primary/15 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex gap-2.5 pt-2 border-t border-border/20">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[10px] font-bold h-8 border-border text-foreground hover:bg-secondary rounded-lg"
                      asChild
                    >
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Visit
                      </a>
                    </Button>
                    
                    {isAlreadyTracked ? (
                      <Button
                        disabled
                        size="sm"
                        className="flex-1 text-[10px] font-bold h-8 gap-1 bg-success/10 text-success border border-success/20 rounded-lg cursor-not-allowed"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        Tracked
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 text-[10px] font-bold h-8 gap-1 bg-outly-accent text-white hover:brightness-110 rounded-lg"
                        onClick={() => handleTrackJob(job)}
                        disabled={trackJobMutation.isPending}
                      >
                        <PlusCircle className="h-3 w-3" />
                        Track
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Limit Exceeded Dialog Modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[420px] border-border bg-card p-6 font-sans text-center">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Lock className="w-6 h-6 shrink-0" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">Daily Limit Reached (3/3)</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Your search tier is limited to 3 job searches per day. Please try again tomorrow.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowLimitModal(false)}
              className="w-full sm:w-auto border-border text-xs font-medium h-10 rounded-full hover:bg-secondary active:scale-[0.98] transition"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </LockedFeatureGuard>
  );
}
