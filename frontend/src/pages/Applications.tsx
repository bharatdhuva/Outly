import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type TrackerApplication } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  X,
  Search,
  Building,
  Briefcase,
  MapPin,
  DollarSign,
  PlusCircle,
  HelpCircle,
} from "lucide-react";

const STAGES = [
  { id: "saved", label: "Saved", color: "border-slate-500/20 bg-slate-500/5 text-slate-400" },
  { id: "applied", label: "Applied", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" },
  { id: "interview", label: "Interview", color: "border-warning/20 bg-warning/5 text-warning" },
  { id: "offer", label: "Offer", color: "border-success/20 bg-success/5 text-success" },
  { id: "rejected", label: "Rejected", color: "border-destructive/20 bg-destructive/5 text-destructive" },
] as const;

export default function ApplicationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Tab state: kanban | scraper
  const [activeTab, setActiveTab] = useState<"kanban" | "scraper">("kanban");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<TrackerApplication | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New Application form state
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newJdUrl, setNewJdUrl] = useState("");
  const [newStage, setNewStage] = useState<TrackerApplication["stage"]>("saved");
  const [newResumeUsed, setNewResumeUsed] = useState<string>("");

  // Scraper state
  const [scrapeRole, setScrapeRole] = useState("");
  const [scrapeLocation, setScrapeLocation] = useState("");
  const [scrapeExperience, setScrapeExperience] = useState("Entry-level");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedJobs, setScrapedJobs] = useState<any[]>([]);
  const [isLiveScrape, setIsLiveScrape] = useState(false);

  // Fetch applications
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: api.applications.list,
  });

  // Fetch resumes to populate resume selector
  const { data: resumes = [] } = useQuery({
    queryKey: ["resume", "list"],
    queryFn: api.resume.list,
  });

  // Pre-select default resume
  useEffect(() => {
    if (resumes.length > 0 && !newResumeUsed) {
      const defaultRes = resumes.find(r => r.is_default === 1);
      if (defaultRes) {
        setNewResumeUsed(String(defaultRes.id));
      }
    }
  }, [resumes]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: api.applications.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      setIsAddOpen(false);
      setNewCompany("");
      setNewRole("");
      setNewJdUrl("");
      setNewStage("saved");
      const defaultRes = resumes.find(r => r.is_default === 1);
      setNewResumeUsed(defaultRes ? String(defaultRes.id) : "");
      toast({ title: "Success", description: "Application added successfully." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TrackerApplication> }) =>
      api.applications.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      if (selectedApp?.id === variables.id) {
        const updated = apps.find((a) => a.id === variables.id);
        if (updated) setSelectedApp({ ...updated, ...variables.data });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.applications.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      setSelectedApp(null);
      toast({ title: "Deleted", description: "Application removed from tracker." });
    },
  });

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("text/plain", id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: TrackerApplication["stage"]) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData("text/plain");
    const id = parseInt(idStr, 10);
    if (!isNaN(id)) {
      updateMutation.mutate({ id, data: { stage: targetStage } });
      toast({
        title: "Stage Updated",
        description: `Application moved to ${targetStage.toUpperCase()}`,
      });
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Company and Role are required." });
      return;
    }
    createMutation.mutate({
      company: newCompany,
      role: newRole,
      jd_url: newJdUrl,
      stage: newStage,
      resume_version_used: newResumeUsed || null,
      notes: null,
      email_history: "[]",
    });
  };

  // Scraper action
  const handleScrapeJobs = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const res = await api.scraper.jobs(scrapeRole, scrapeLocation, scrapeExperience);
      setScrapedJobs(res.jobs);
      setIsLiveScrape(res.isLive);
      toast({
        title: "Search Complete",
        description: `Found ${res.jobs.length} relevant listings from top boards.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: String(err),
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleQuickAdd = (job: any) => {
    createMutation.mutate({
      company: job.company,
      role: job.title,
      jd_url: job.url,
      stage: "saved",
      resume_version_used: null,
      notes: `Scraped from ${job.source}. Experience Level: ${job.experience || 'N/A'}. Salary Estimate: ${job.salary || 'N/A'}.`,
      email_history: "[]",
    });
  };

  const filteredApps = apps.filter(
    (app) =>
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in relative min-h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-primary">Workspace</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">Applications Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your pipeline stages. Find and track new listings with ease.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/95">
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("kanban")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "kanban"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Kanban Board
        </button>
        <button
          onClick={() => setActiveTab("scraper")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "scraper"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Job Search Scraper
        </button>
      </div>

      {activeTab === "kanban" ? (
        <>
          {/* Filter / Search Bar */}
          <div className="flex items-center gap-2 max-w-sm rounded-md border border-border bg-white px-3 py-2 text-muted-foreground shadow-sm">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Filter by company or role..."
              className="w-full text-[13px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-5 items-start">
              {STAGES.map((stage) => {
                const stageApps = filteredApps.filter((a) => a.stage === stage.id);
                return (
                  <div
                    key={stage.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    className={`rounded-xl border p-4 min-h-[500px] flex flex-col gap-3 transition-colors ${stage.color}`}
                  >
                    <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-1">
                      <span className="text-[14px] font-semibold">{stage.label}</span>
                      <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] font-bold text-foreground">
                        {stageApps.length}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col gap-2.5">
                      {stageApps.map((app) => {
                        const linkedResume = resumes.find(r => String(r.id) === String(app.resume_version_used));
                        return (
                          <div
                            key={app.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, app.id)}
                            onClick={() => setSelectedApp(app)}
                            className="group cursor-grab active:cursor-grabbing rounded-lg border border-border bg-card p-3.5 shadow-sm hover:border-primary/30 transition-all animate-pop-in"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-[14px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {app.company}
                              </h4>
                              {app.jd_url && (
                                <a
                                  href={app.jd_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            <p className="text-[12px] text-muted-foreground mt-1 truncate">{app.role}</p>
  
                            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(app.created_at).toLocaleDateString()}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {linkedResume && (
                                  <span className="flex items-center gap-0.5 rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[9px] font-semibold max-w-[100px] truncate" title={linkedResume.label}>
                                    📄 {linkedResume.label}
                                  </span>
                                )}
                                {app.notes && (
                                  <span className="flex items-center gap-1 rounded bg-secondary px-1 py-0.5 text-foreground/80 text-[10px]">
                                    Notes
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {stageApps.length === 0 && (
                        <div className="flex-1 flex items-center justify-center border border-dashed border-border/40 rounded-lg p-6 text-center text-[12px] text-muted-foreground/60">
                          Drag cards here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Scraper Tab */
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-[15px] font-semibold text-foreground mb-3">Auto-Fetch Listings</h2>
            <form onSubmit={handleScrapeJobs} className="grid gap-4 md:grid-cols-4 items-end text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-primary" /> Role Title
                </label>
                <Input
                  required
                  placeholder="e.g. Frontend Engineer"
                  value={scrapeRole}
                  onChange={(e) => setScrapeRole(e.target.value)}
                  className="bg-white border-border text-xs h-9 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Location
                </label>
                <Input
                  placeholder="e.g. Remote"
                  value={scrapeLocation}
                  onChange={(e) => setScrapeLocation(e.target.value)}
                  className="bg-white border-border text-xs h-9 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Experience Level
                </label>
                <select
                  value={scrapeExperience}
                  onChange={(e) => setScrapeExperience(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-white p-2 outline-none h-9 focus:border-primary"
                >
                  <option value="Entry-level">Entry-level</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior-level">Senior-level</option>
                </select>
              </div>

              <Button type="submit" disabled={isScraping} className="h-9 w-full bg-primary text-primary-foreground hover:bg-primary/95">
                {isScraping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search Job Boards"
                )}
              </Button>
            </form>
          </section>

          {/* Scrape results list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Search Results</h3>
              {scrapedJobs.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-mono bg-secondary/80 px-2 py-0.5 rounded border border-border">
                  {isLiveScrape ? "Live Apify Scraper connected" : "Simulated Fallback"}
                </span>
              )}
            </div>

            {scrapedJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/10 p-12 text-center text-muted-foreground min-h-[220px] flex flex-col items-center justify-center">
                <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs font-semibold">No search criteria entered.</p>
                <p className="text-[11px] text-muted-foreground/60 max-w-[280px] mt-1">
                  Enter target role & location parameters above and search across LinkedIn, Wellfound, Internshala, and Naukri.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {scrapedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between shadow-sm hover:border-primary/30 transition-all animate-pop-in space-y-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] uppercase font-bold text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-primary" /> {job.company}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-secondary">{job.source}</span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-1">{job.title}</h4>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-border/40 pt-2 text-[10px]">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Experience: {job.experience}</span>
                        {job.salary && (
                          <span className="flex items-center text-primary font-bold">
                            <DollarSign className="h-3 w-3" /> {job.salary}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-[10px] h-7 px-2"
                          asChild
                        >
                          <a href={job.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" /> Visit Listing
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-[10px] h-7 px-2 gap-1 bg-primary text-primary-foreground hover:bg-primary/95"
                          onClick={() => handleQuickAdd(job)}
                        >
                          <PlusCircle className="h-3 w-3" /> Track Job
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Drawer (Side Drawer) */}
      {selectedApp && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-xs" onClick={() => setSelectedApp(null)} />
          <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg border-l border-border bg-white p-6 shadow-2xl overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
              <div>
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Application Details</span>
                <h2 className="text-[20px] font-bold text-foreground mt-0.5">{selectedApp.company}</h2>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setSelectedApp(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground">Position / Role</label>
                <p className="text-[14px] font-semibold text-foreground mt-1">{selectedApp.role}</p>
              </div>

              {selectedApp.jd_url && (
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground">Job Description URL</label>
                  <a
                    href={selectedApp.jd_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline mt-1.5"
                  >
                    View Job posting
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Pipeline Stage</label>
                <select
                  value={selectedApp.stage}
                  onChange={(e) => updateMutation.mutate({ id: selectedApp.id, data: { stage: e.target.value as any } })}
                  className="w-full text-[13px] rounded-lg border border-border bg-secondary p-2.5 outline-none focus:border-primary"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Resume Version Used</label>
                <select
                  value={selectedApp.resume_version_used || ""}
                  onChange={(e) => updateMutation.mutate({ id: selectedApp.id, data: { resume_version_used: e.target.value } })}
                  className="w-full text-[13px] rounded-lg border border-border bg-secondary p-2.5 outline-none focus:border-primary"
                >
                  <option value="">Select Resume...</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Notes</label>
                <Textarea
                  placeholder="Paste context, contacts, salary details, or next step timelines..."
                  className="min-h-[120px] rounded-lg border-border text-[13px] leading-5"
                  value={selectedApp.notes || ""}
                  onChange={(e) => updateMutation.mutate({ id: selectedApp.id, data: { notes: e.target.value } })}
                />
              </div>

              {/* Status Timeline */}
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Application Timeline
                </label>
                <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3.5 text-[12px]">
                  <div className="flex gap-3">
                    <span className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                    <div>
                      <p className="font-semibold text-foreground">Added to Tracker</p>
                      <p className="text-muted-foreground mt-0.5">{new Date(selectedApp.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="h-2 w-2 rounded-full bg-success mt-1.5" />
                    <div>
                      <p className="font-semibold text-foreground">Last Stage Updated</p>
                      <p className="text-muted-foreground mt-0.5">{new Date(selectedApp.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email History */}
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Associated Cold Mail
                </label>
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-[12px] text-muted-foreground">
                  No cold emails associated yet. Track outreach via Cold Mail dashboard.
                </div>
              </div>

              <div className="border-t border-border/60 pt-5 flex justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 text-[12px]"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this application?")) {
                      deleteMutation.mutate(selectedApp.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Card
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>
                  Close
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-2xl space-y-4 animate-pop-in">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-[16px] font-bold text-foreground">Add New Application</h3>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setIsAddOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-[13px]">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Razorpay"
                  className="w-full rounded-lg border border-border bg-white p-2.5 outline-none focus:border-primary"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Role / Position *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineer Intern"
                  className="w-full rounded-lg border border-border bg-white p-2.5 outline-none focus:border-primary"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Job Description URL</label>
                <input
                  type="url"
                  placeholder="e.g. https://careers.razorpay.com/jobs/..."
                  className="w-full rounded-lg border border-border bg-white p-2.5 outline-none focus:border-primary"
                  value={newJdUrl}
                  onChange={(e) => setNewJdUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Initial Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-white p-2.5 outline-none focus:border-primary"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Resume Version</label>
                <select
                  value={newResumeUsed}
                  onChange={(e) => setNewResumeUsed(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white p-2.5 outline-none focus:border-primary text-[13px]"
                >
                  <option value="">Select Resume...</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.label} {r.is_default === 1 ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/95">
                  {createMutation.isPending ? "Adding..." : "Add to Board"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
