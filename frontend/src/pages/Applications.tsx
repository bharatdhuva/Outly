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
import LockedFeatureGuard from "@/components/LockedFeatureGuard";

const STAGES = [
  { id: "saved", label: "Saved", color: "border-slate-500/20 bg-slate-500/5 text-slate-500" },
  { id: "applied", label: "Applied", color: "border-blue-500/20 bg-blue-500/5 text-blue-500" },
  { id: "interview", label: "Interview", color: "border-warning/20 bg-warning/5 text-warning" },
  { id: "offer", label: "Offer", color: "border-success/20 bg-success/5 text-success" },
  { id: "rejected", label: "Rejected", color: "border-destructive/20 bg-destructive/5 text-destructive" },
] as const;

export default function ApplicationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<TrackerApplication | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteAppTarget, setDeleteAppTarget] = useState<TrackerApplication | null>(null);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [activeStageTab, setActiveStageTab] = useState<TrackerApplication["stage"]>("saved");

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
      toast({ title: "Success", description: "Application added successfully." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TrackerApplication> }) =>
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

  const filteredApps = apps.filter(
    (app) =>
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LockedFeatureGuard featureTitle="Job Tracker & Application Scheduler">
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
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none text-left">
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
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`rounded-2xl border p-4 min-h-[420px] lg:min-h-[560px] flex flex-col gap-3.5 transition-colors ${stage.color}`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-0.5 text-left">
                  <span className="text-[12.5px] font-bold text-foreground/80 uppercase tracking-wider">{stage.label}</span>
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[9.5px] font-extrabold text-foreground">
                    {stageApps.length}
                  </span>
                </div>

                {/* Column container */}
                <div className="flex-1 flex flex-col gap-3">
                  {stageApps.map((app) => {
                    const linkedResume = resumes.find(r => String(r.id) === String(app.resume_version_used));
                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onClick={() => setSelectedApp(app)}
                        className="group cursor-grab active:cursor-grabbing rounded-xl border border-border bg-white p-3.5 shadow-xs hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-left animate-pop-in relative"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-[13px] font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {app.company}
                          </h4>
                          {app.jd_url && (
                            <a
                              href={app.jd_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-muted-foreground hover:text-primary transition-colors mt-0.5 shrink-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 truncate">{app.role}</p>

                        <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="h-3 w-3" />
                            {new Date(app.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-1">
                            {linkedResume && (
                              <span 
                                className="flex items-center gap-0.5 rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[8.5px] font-bold max-w-[80px] truncate" 
                                title={linkedResume.label}
                              >
                                📄 {linkedResume.label}
                              </span>
                            )}
                            {app.notes && (
                              <span className="flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-foreground/80 text-[8.5px] font-bold">
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
                                  toast({
                                    title: "Stage Updated",
                                    description: `Moved ${app.company} to ${prevStage.toUpperCase()}`,
                                  });
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
                                  toast({
                                    title: "Stage Updated",
                                    description: `Moved ${app.company} to ${nextStage.toUpperCase()}`,
                                  });
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
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-foreground/5 rounded-xl p-6 text-center text-[10.5px] text-muted-foreground/50 select-none min-h-[120px]">
                      Drag cards here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side Details Drawer */}
      {selectedApp && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-xs" onClick={() => setSelectedApp(null)} />
          <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md border-l border-border bg-white p-6 shadow-2xl overflow-y-auto animate-slide-in text-left font-sans">
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-5">
              <div>
                <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block">Application Details</span>
                <h2 className="text-[18px] font-bold text-foreground mt-1">{selectedApp.company}</h2>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setSelectedApp(null)}>
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
                  value={selectedApp.notes || ""}
                  onChange={(e) => updateMutation.mutate({ id: selectedApp.id, data: { notes: e.target.value } })}
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
                  onClick={() => setSelectedApp(null)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[420px] border-border bg-card p-6 font-sans">
          <DialogHeader className="flex flex-col items-center text-center space-y-3 border-b border-border/40 pb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Building className="w-6 h-6 shrink-0" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">Add New Application</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Track a new position in your applications pipeline.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 py-4 text-xs font-medium">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Stripe"
                className="w-full rounded-lg border border-border bg-white p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground shadow-sm placeholder:text-muted-foreground/60"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Role / Position *</label>
              <input
                type="text"
                required
                placeholder="e.g. Software Engineer Intern"
                className="w-full rounded-lg border border-border bg-white p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground shadow-sm placeholder:text-muted-foreground/60"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Job Description URL</label>
              <input
                type="url"
                placeholder="e.g. https://careers.stripe.com/..."
                className="w-full rounded-lg border border-border bg-white p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground shadow-sm placeholder:text-muted-foreground/60"
                value={newJdUrl}
                onChange={(e) => setNewJdUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Initial Stage</label>
              <select
                value={newStage}
                onChange={(e) => setNewStage(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-white p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary text-foreground shadow-sm cursor-pointer"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Resume Version</label>
              <select
                value={newResumeUsed}
                onChange={(e) => setNewResumeUsed(e.target.value)}
                className="w-full rounded-lg border border-border bg-white p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary text-foreground shadow-sm cursor-pointer"
              >
                <option value="">Select Resume...</option>
                {resumes.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.label} {r.is_default === 1 ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-center border-t border-border/40 pt-4 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto border-border text-xs font-medium h-9 rounded-full hover:bg-secondary active:scale-[0.98] transition"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-medium h-9 rounded-full shadow-sm active:scale-[0.98] transition-all"
              >
                {createMutation.isPending ? "Adding..." : "Add to Board"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE APPLICATION ALERT DIALOG */}
      <AlertDialog open={!!deleteAppTarget} onOpenChange={(open) => !open && setDeleteAppTarget(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application Card?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-foreground">"{deleteAppTarget?.company_name} — {deleteAppTarget?.role_title}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
              onClick={() => {
                if (deleteAppTarget) {
                  deleteMutation.mutate(deleteAppTarget.id);
                  setDeleteAppTarget(null);
                  setSelectedApp(null);
                }
              }}
            >
              Delete Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </div>
    </LockedFeatureGuard>
  );
}
