import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type TrackerApplication } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  HelpCircle,
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react";


const STAGES = [
  { id: "saved", label: "Saved", color: "border-slate-500/20 bg-slate-500/5 text-slate-500" },
  { id: "applied", label: "Applied", color: "border-blue-500/20 bg-blue-500/5 text-blue-500" },
  { id: "interview", label: "Interview", color: "border-warning/20 bg-warning/5 text-warning" },
  { id: "offer", label: "Offer", color: "border-success/20 bg-success/5 text-success" },
  { id: "rejected", label: "Rejected", color: "border-destructive/20 bg-destructive/5 text-destructive" },
] as const;

const getRelativeTime = (dateString: string) => {
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return "1 week ago";
    return `${weeks} weeks ago`;
  } catch {
    return "Active";
  }
};

const jobBoardsList = [
  { id: "linkedin", domain: "linkedin.com" },
  { id: "wellfound", domain: "wellfound.com" },
  { id: "naukri", domain: "naukri.com" },
  { id: "internshala", domain: "internshala.com" },
  { id: "cutshort", domain: "cutshort.io" },
  { id: "indeed", domain: "indeed.com" },
  { id: "glassdoor", domain: "glassdoor.com" },
];

function CompanyLogo({ company }: { company: string }) {
  const cleaned = company.toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  const [src, setSrc] = useState(`https://logo.clearbit.com/${cleaned}.com`);
  const [fallbackStage, setFallbackStage] = useState(0);

  const handleErr = () => {
    if (fallbackStage === 0) {
      setSrc(`https://www.google.com/s2/favicons?domain=${cleaned}.com&sz=128`);
      setFallbackStage(1);
    } else {
      setFallbackStage(2);
    }
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth <= 1) {
      handleErr();
    }
  };

  if (fallbackStage === 2 || !cleaned) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#FAF6EE] text-muted-foreground/70 border border-[#e8e2d5] flex items-center justify-center shrink-0 shadow-3xs">
        <Building className="h-4 w-4 stroke-[1.8] text-outly-accent" />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-white border border-[#e8e2d5]/60 flex items-center justify-center overflow-hidden shrink-0 shadow-3xs">
      <img 
        src={src} 
        alt={company} 
        className="h-6 w-6 object-contain shrink-0" 
        onLoad={handleLoad}
        onError={handleErr}
      />
    </div>
  );
}

const getStagePlaceholderIcon = (stageId: string) => {
  switch (stageId) {
    case "saved":
      return (
        <svg className="w-7 h-7 text-slate-400/70 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      );
    case "applied":
      return (
        <svg className="w-7 h-7 text-slate-400/70 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      );
    case "interview":
      return (
        <svg className="w-7 h-7 text-slate-400/70 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case "offer":
      return (
        <svg className="w-7 h-7 text-slate-400/70 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm-2 4h4M5 20h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z" />
        </svg>
      );
    case "rejected":
    default:
      return (
        <svg className="w-7 h-7 text-slate-400/70 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const getStageHeaderIcon = (stageId: string) => {
  switch (stageId) {
    case "saved":
      return (
        <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      );
    case "applied":
      return (
        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      );
    case "interview":
      return (
        <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case "offer":
      return (
        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm-2 4h4M5 20h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z" />
        </svg>
      );
    case "rejected":
    default:
      return (
        <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

export default function ApplicationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<TrackerApplication | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteAppTarget, setDeleteAppTarget] = useState<TrackerApplication | null>(null);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [activeStageTab, setActiveStageTab] = useState<TrackerApplication["stage"]>("saved");
  const [localNotes, setLocalNotes] = useState("");

  // Sync selectedApp notes to local state when active app changes
  useEffect(() => {
    if (selectedApp) {
      setLocalNotes(selectedApp.notes || "");
    } else {
      setLocalNotes("");
    }
  }, [selectedApp?.id]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // New Application form state
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newJdUrl, setNewJdUrl] = useState("");
  const [newStage, setNewStage] = useState<TrackerApplication["stage"]>("saved");
  const [newResumeUsed, setNewResumeUsed] = useState<string>("");

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
      toast({ title: "Stage Updated" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TrackerApplication> }) =>
      api.applications.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["applications"] });
      const previousApps = queryClient.getQueryData<TrackerApplication[]>(["applications"]);
      if (previousApps) {
        queryClient.setQueryData<TrackerApplication[]>(
          ["applications"],
          previousApps.map((app) => (app.id === id ? { ...app, ...data } : app))
        );
      }
      return { previousApps };
    },
    onError: (err, variables, context) => {
      if (context?.previousApps) {
        queryClient.setQueryData(["applications"], context.previousApps);
      }
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: String(err),
      });
    },
    onSuccess: (_, variables) => {
      if (selectedApp?.id === variables.id) {
        const updated = apps.find((a) => a.id === variables.id);
        if (updated) setSelectedApp({ ...updated, ...variables.data });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.applications.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      setSelectedApp(null);
      toast({ title: "Stage Updated" });
    },
  });

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: TrackerApplication["stage"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      updateMutation.mutate({ id, data: { stage: targetStage } });
      setActiveStageTab(targetStage);
      toast({ title: "Stage Updated" });
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

  const filteredApps = apps.filter(
    (app) =>
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCloseDetails = () => {
    if (selectedApp && localNotes !== (selectedApp.notes || "")) {
      updateMutation.mutate({ id: selectedApp.id, data: { notes: localNotes } });
    }
    setSelectedApp(null);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6 sm:px-8 space-y-8 animate-fade-in pb-16">
      
      {/* Header Title Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-left">
        <div className="space-y-2.5">
          <span className="text-xs font-extrabold tracking-[0.2em] text-outly-accent uppercase bg-outly-accent/5 px-3 py-1.5 rounded-full inline-block">
            WORKSPACE
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
            Applications Tracker
          </h1>
          <p className="text-muted-foreground text-[13px] sm:text-[14px] leading-relaxed max-w-2xl">
            Manage your pipeline stages. Drag and drop cards to update interview schedules, offers, and active application statuses.
          </p>
        </div>
        <div className="shrink-0">
          <Button 
            onClick={() => setIsAddOpen(true)} 
            className="bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm rounded-lg h-10 px-5 gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-2 max-w-sm rounded-xl border border-border bg-card shadow-[var(--shadow-card)] px-3.5 py-2.5 text-muted-foreground text-left">
        <Search className="h-4.5 w-4.5 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Filter by company or role..."
          className="w-full text-xs font-medium bg-transparent outline-none text-foreground placeholder:text-muted-foreground/65"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Mobile Stage Selector Tabs */}
      {isMobile && (
        <div className="flex overflow-x-auto gap-2 pb-1 text-left [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {STAGES.map((s) => {
            const stageAppsCount = filteredApps.filter((a) => a.stage === s.id).length;
            const isActive = activeStageTab === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStageTab(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border shrink-0 transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-muted-foreground border-border hover:bg-slate-50"
                }`}
              >
                <span>{s.label}</span>
                <span className={`rounded-full px-1.5 py-0.25 text-[9px] ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-slate-100 text-muted-foreground"
                }`}>
                  {stageAppsCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Kanban Board Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20 bg-card border border-border rounded-2xl shadow-[var(--shadow-card)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-5 items-start">
          {STAGES.map((stage) => {
            if (isMobile && activeStageTab !== stage.id) return null;
            const stageApps = filteredApps.filter((a) => a.stage === stage.id);
            return (
              <div key={stage.id} className="flex flex-col gap-3 min-h-[420px] lg:min-h-[560px] text-left">
                {/* Column header (Outside container) */}
                <div className="flex items-center justify-between px-1.5 py-0.5">
                  <div className="flex items-center gap-2">
                    {getStageHeaderIcon(stage.id)}
                    <span className="text-[13px] font-extrabold text-foreground tracking-tight">{stage.label}</span>
                    <span className="text-[10px] font-extrabold text-muted-foreground/80 bg-slate-200/60 px-1.5 py-0.25 rounded-md">
                      {stageApps.length}
                    </span>
                  </div>
                </div>

                {/* Column card container */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className="flex-1 rounded-[24px] border border-slate-200 bg-[#f1f5f9] p-4 flex flex-col gap-3.5 shadow-3xs"
                >
                  {/* Column container */}
                  <div className="flex-1 flex flex-col gap-3">
                  {stageApps.map((app) => {
                    const linkedResume = resumes.find(r => String(r.id) === String(app.resume_version_used));
                    const appDate = app.createdAt || app.created_at;
                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onClick={() => setSelectedApp(app)}
                        className="group cursor-grab active:cursor-grabbing rounded-[24px] border border-border/50 bg-card p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left animate-pop-in relative flex flex-col justify-between min-h-[180px] space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Top Row: Standalone Logo & Actions */}
                          <div className="flex items-center justify-between">
                            <CompanyLogo company={app.company} />
                            
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {app.jd_url && (
                                <a
                                  href={app.jd_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-secondary rounded-lg"
                                  title="Visit job post"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => setDeleteAppTarget(app)}
                                className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="Delete application"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Second Row: Company Name & Time */}
                          <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                            <span className="font-bold text-foreground/80 truncate max-w-[130px]">{app.company}</span>
                            <span>•</span>
                            <span>{appDate ? getRelativeTime(appDate) : "Just now"}</span>
                          </div>

                          {/* Third Row: Role Title */}
                          <h4 className="text-[13.5px] font-extrabold text-foreground tracking-tight leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {app.role}
                          </h4>
                        </div>

                        {/* Fourth Row: Footer / Tags */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-3 border-t border-border/30">
                          <span className="flex items-center gap-1 font-semibold text-muted-foreground/80">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                            {appDate ? new Date(appDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "N/A"}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {linkedResume && (
                              <span 
                                className="inline-flex items-center gap-0.5 rounded-full bg-primary/5 text-primary border border-primary/10 px-2.5 py-0.5 text-[8.5px] font-bold max-w-[85px] truncate" 
                                title={linkedResume.label}
                              >
                                📄 {linkedResume.label}
                              </span>
                            )}
                            {app.notes && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#f3f4f6] text-foreground/75 px-2.5 py-0.5 text-[8.5px] font-bold">
                                Notes
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Stage Mover for Mobile */}
                        {isMobile && (
                          <div 
                            className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50 gap-2" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={stage.id === "saved"}
                              className="h-7 w-7 rounded-lg border border-border hover:bg-slate-50 disabled:opacity-30 shrink-0"
                              onClick={() => {
                                const currentIndex = STAGES.findIndex(s => s.id === stage.id);
                                if (currentIndex > 0) {
                                  const prevStage = STAGES[currentIndex - 1].id;
                                  updateMutation.mutate({ id: app.id, data: { stage: prevStage } });
                                  setActiveStageTab(prevStage);
                                  toast({ title: "Stage Updated" });
                                }
                              }}
                            >
                              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            
                            <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider">
                              Move Stage
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={stage.id === "rejected"}
                              className="h-7 w-7 rounded-lg border border-border hover:bg-slate-50 disabled:opacity-30 shrink-0"
                              onClick={() => {
                                const currentIndex = STAGES.findIndex(s => s.id === stage.id);
                                if (currentIndex < STAGES.length - 1) {
                                  const nextStage = STAGES[currentIndex + 1].id;
                                  updateMutation.mutate({ id: app.id, data: { stage: nextStage } });
                                  setActiveStageTab(nextStage);
                                  toast({ title: "Stage Updated" });
                                }
                              }}
                            >
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {stageApps.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-white/50 rounded-[20px] p-6 text-center text-[10.5px] font-bold text-slate-400 select-none min-h-[120px] transition-colors">
                      {getStagePlaceholderIcon(stage.id)}
                      <span>Drag cards here</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Side Details Drawer */}
      {selectedApp && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-xs" onClick={handleCloseDetails} />
          <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md border-l border-border bg-card p-6 shadow-2xl overflow-y-auto animate-slide-in text-left font-sans">
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-5">
              <div>
                <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block">Application Details</span>
                <h2 className="text-[18px] font-bold text-foreground mt-1">{selectedApp.company}</h2>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={handleCloseDetails}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Position / Role</label>
                <p className="text-[13px] font-semibold text-foreground mt-1">{selectedApp.role}</p>
              </div>

              {selectedApp.jd_url && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Job Description URL</label>
                  <a
                    href={selectedApp.jd_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline mt-1.5 font-bold"
                  >
                    View Job Posting
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Pipeline Stage</label>
                <select
                  value={selectedApp.stage}
                  onChange={(e) => updateMutation.mutate({ id: selectedApp.id, data: { stage: e.target.value as any } })}
                  className="w-full text-xs font-semibold rounded-lg border border-border bg-secondary/35 p-2.5 outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Resume Version Used</label>
                <select
                  value={selectedApp.resume_version_used || ""}
                  onChange={(e) => updateMutation.mutate({ id: selectedApp.id, data: { resume_version_used: e.target.value } })}
                  className="w-full text-xs font-semibold rounded-lg border border-border bg-secondary/35 p-2.5 outline-none focus:ring-1 focus:ring-primary text-foreground"
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
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Notes</label>
                <Textarea
                  placeholder="Paste context, contacts, salary details, or next step timelines..."
                  className="min-h-[120px] rounded-xl border-border text-xs leading-relaxed p-3"
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  onBlur={() => {
                    if (localNotes !== (selectedApp.notes || "")) {
                      updateMutation.mutate({ id: selectedApp.id, data: { notes: localNotes } });
                    }
                  }}
                />
              </div>

              {/* Status Timeline */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Application Timeline
                </label>
                <div className="rounded-xl border border-border bg-secondary/15 p-4 space-y-3 font-mono text-[10px] text-muted-foreground">
                  <div className="flex gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                    <div>
                      <p className="font-bold text-foreground/80">Added to Tracker</p>
                      <p className="mt-0.5">{selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleString() : "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success mt-1 shrink-0" />
                    <div>
                      <p className="font-bold text-foreground/80">Last Stage Updated</p>
                      <p className="mt-0.5">{selectedApp.updatedAt ? new Date(selectedApp.updatedAt).toLocaleString() : "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email History */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Associated Outreach
                </label>
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-[10.5px] text-muted-foreground/60 bg-secondary/10">
                  No outreach campaigns linked to this application yet.
                </div>
              </div>

              {/* Delete / Close Action buttons */}
              <div className="border-t border-border/40 pt-5 flex justify-between items-center mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-[11px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg h-8"
                  onClick={() => {
                    setDeleteAppTarget(selectedApp);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Card
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-[11px] font-semibold border-border text-foreground hover:bg-secondary rounded-lg"
                  onClick={handleCloseDetails}
                >
                  Close
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Add New Application Dialog Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="w-[95%] max-w-[420px] border-border bg-card p-5 font-sans rounded-2xl">
          <DialogHeader className="flex flex-col items-start text-left space-y-1.5 border-b border-border/40 pb-3">
            <DialogTitle className="text-base font-bold text-foreground">Add New Application</DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground leading-none">
              Track a new position in your pipeline.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-3.5 py-3 text-xs font-semibold">
            {/* Row 1: Company and Role */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Company *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe"
                  className="w-full rounded-lg border border-border bg-card p-2 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground shadow-xs placeholder:text-muted-foreground/60 h-9"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Role / Position *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineer"
                  className="w-full rounded-lg border border-border bg-card p-2 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground shadow-xs placeholder:text-muted-foreground/60 h-9"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Job Description URL */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Job Description URL</label>
              <input
                type="url"
                placeholder="e.g. https://careers.stripe.com/..."
                className="w-full rounded-lg border border-border bg-card p-2 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground shadow-xs placeholder:text-muted-foreground/60 h-9"
                value={newJdUrl}
                onChange={(e) => setNewJdUrl(e.target.value)}
              />
            </div>

            {/* Row 3: Initial Stage & Resume Version */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Initial Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary text-foreground shadow-xs cursor-pointer h-9"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Resume Version</label>
                <select
                  value={newResumeUsed}
                  onChange={(e) => setNewResumeUsed(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary text-foreground shadow-xs cursor-pointer h-9"
                >
                  <option value="">Select Resume...</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.label} {r.is_default === 1 ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="flex flex-row gap-2.5 justify-end border-t border-border/40 pt-3 mt-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 sm:flex-none border-border text-xs font-semibold h-9 rounded-lg hover:bg-secondary active:scale-[0.98] transition"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold h-9 rounded-lg shadow-xs active:scale-[0.98] transition-all"
              >
                {createMutation.isPending ? "Adding..." : "Add to Board"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE APPLICATION ALERT DIALOG */}
      <AlertDialog open={!!deleteAppTarget} onOpenChange={(open) => !open && setDeleteAppTarget(null)}>
        <AlertDialogContent className="border-border bg-card max-w-xs p-4 rounded-2xl gap-0">
          <AlertDialogHeader className="pb-0 space-y-0">
            <AlertDialogTitle className="sr-only">Delete confirmation</AlertDialogTitle>
            <AlertDialogDescription className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
              <span className="flex items-center justify-center h-8 w-8 rounded-full bg-destructive/10 shrink-0">
                <Trash2 className="h-4 w-4 text-destructive" />
              </span>
              Delete this application?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 mt-4">
            <AlertDialogCancel className="flex-1 h-9 rounded-xl text-xs font-semibold m-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 h-9 rounded-xl text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 m-0"
              onClick={() => {
                if (deleteAppTarget) {
                  deleteMutation.mutate(deleteAppTarget.id);
                  setDeleteAppTarget(null);
                  setSelectedApp(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      </div>
  );
}
