import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type TrackerApplication, type ResumeVaultItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notify";
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
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  ExternalLink,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { m, AnimatePresence } from "motion/react";
import { dur, ease, spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { Spinner } from "@/components/Spinner";

const STAGES = [
  { id: "saved",     label: "Saved",     color: "#6B6760", bg: "#F0EDE7" },
  { id: "applied",   label: "Applied",   color: "#0284c7", bg: "#e0f2fe" },
  { id: "interview", label: "Interview", color: "#d97706", bg: "#fef3c7" },
  { id: "offer",     label: "Offer",     color: "#10b981", bg: "#eaf8f2" },
  { id: "rejected",  label: "Rejected",  color: "#ef4444", bg: "#fee2e2" },
] as const;

type StageId = typeof STAGES[number]["id"];

// ── Company Logo: Clearbit with neutral initial fallback ─────────────────────
function CompanyLogo({ company, size = 28 }: { company: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initial = company.trim().charAt(0).toUpperCase();

  const domain = company
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)[0];
  const logoUrl = `https://logo.clearbit.com/${domain}.com`;

  if (failed) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-outly-border/40 border border-outly-border text-[#1A1A1A] font-medium text-xs flex items-center justify-center shrink-0 select-none"
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={company}
      style={{ width: size, height: size }}
      className="rounded-full object-contain shrink-0 bg-white border border-[#E0DBCF]"
      onError={() => setFailed(true)}
    />
  );
}

const getRelativeTime = (dateString?: string) => {
  if (!dateString) return "Active";
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Today";
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks <= 4) return `${weeks}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  } catch {
    return "Active";
  }
};

const formatCardDate = (dateString?: string) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
};

export default function Applications() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<TrackerApplication | null>(null);
  const [localNotes, setLocalNotes] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Mobile stage filter
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobileStageIdx, setMobileStageIdx] = useState(0);

  // Form state
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newStage, setNewStage] = useState<StageId>("saved");
  const [newJdUrl, setNewJdUrl] = useState("");
  const [newResumeVersion, setNewResumeVersion] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { data: apps = [], isLoading } = useQuery<TrackerApplication[]>({
    queryKey: ["applications"],
    queryFn: api.tracker.list,
  });

  const { data: resumes = [] } = useQuery<ResumeVaultItem[]>({
    queryKey: ["resumes"],
    queryFn: api.resumes.list,
  });

  const getResumeLabel = (versionUsed?: string) => {
    if (!versionUsed) return null;
    const match = resumes.find((r) => r.title === versionUsed || r.id === versionUsed);
    return match ? match.title : versionUsed;
  };

  const createMutation = useMutation({
    mutationFn: (data: Partial<TrackerApplication>) => api.tracker.create(data),
    onSuccess: (newApp) => {
      queryClient.setQueryData<TrackerApplication[]>(["applications"], (old = []) => [newApp, ...old]);
      notify.success("Application tracked");
      setIsAddOpen(false);
      resetAddForm();
    },
    onError: () => notify.error("Failed to add application"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TrackerApplication> }) =>
      api.tracker.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<TrackerApplication[]>(["applications"], (old = []) =>
        old.map((a) => (a.id === updated.id ? updated : a))
      );
      if (selectedApp && selectedApp.id === updated.id) {
        setSelectedApp(updated);
      }
    },
    onError: () => notify.error("Failed to update application"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.tracker.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<TrackerApplication[]>(["applications"], (old = []) =>
        old.filter((a) => a.id !== deletedId)
      );
      notify.success("Application removed");
      setSelectedApp(null);
      setDeleteConfirmOpen(false);
    },
    onError: () => notify.error("Failed to delete application"),
  });

  const resetAddForm = () => {
    setNewCompany("");
    setNewRole("");
    setNewLocation("");
    setNewStage("saved");
    setNewJdUrl("");
    setNewResumeVersion("");
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) {
      notify.error("Company and role are required");
      return;
    }
    createMutation.mutate({
      company: newCompany.trim(),
      role: newRole.trim(),
      location: newLocation.trim() || undefined,
      stage: newStage,
      jd_url: newJdUrl.trim() || undefined,
      resume_version_used: newResumeVersion || undefined,
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStage: StageId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const app = apps.find((a) => a.id === id);
    if (!app || app.stage === targetStage) return;

    const prevStage = app.stage;
    updateMutation.mutate({ id, data: { stage: targetStage } });

    notify.success(`Moved to ${STAGES.find((s) => s.id === targetStage)?.label}`, {
      action: {
        label: "Undo",
        onClick: () => updateMutation.mutate({ id, data: { stage: prevStage } }),
      },
    });
  };

  const moveAppToStage = (id: string, direction: "prev" | "next") => {
    const app = apps.find((a) => a.id === id);
    if (!app) return;
    const currIdx = STAGES.findIndex((s) => s.id === app.stage);
    const newIdx = direction === "next" ? currIdx + 1 : currIdx - 1;
    if (newIdx < 0 || newIdx >= STAGES.length) return;

    const targetStage = STAGES[newIdx].id;
    const prevStage = app.stage;
    updateMutation.mutate({ id, data: { stage: targetStage } });

    notify.success(`Moved to ${STAGES[newIdx].label}`, {
      action: {
        label: "Undo",
        onClick: () => updateMutation.mutate({ id, data: { stage: prevStage } }),
      },
    });
  };

  const filteredApps = apps.filter((app) => {
    const q = searchTerm.toLowerCase();
    return (
      app.company.toLowerCase().includes(q) ||
      app.role.toLowerCase().includes(q) ||
      (app.location && app.location.toLowerCase().includes(q))
    );
  });

  const handleCloseDetails = () => {
    if (selectedApp && localNotes !== (selectedApp.notes || "")) {
      updateMutation.mutate({ id: selectedApp.id, data: { notes: localNotes } });
    }
    setSelectedApp(null);
  };

  const currentStage = STAGES[mobileStageIdx];
  const stageApps = filteredApps.filter((a) => a.stage === currentStage.id);

  function renderDialogs() {
    return (
      <>
        {/* Add Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="w-[94%] max-w-[440px] border-[#E0DBCF] bg-white p-5 sm:p-6 rounded-2xl text-left shadow-xl">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base font-semibold text-[#1A1A1A]">Add Application</DialogTitle>
              <DialogDescription className="text-xs text-[#6B6760]">
                Track a new job opportunity in your pipeline.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 mt-3">
              <div>
                <label className="text-[11px] font-medium text-[#1A1A1A]">Company *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe, Linear, Figma"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-[#E0DBCF] rounded-lg text-xs font-medium text-[#1A1A1A] placeholder:text-[#B0ADA9] outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#1A1A1A]">Role / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-[#E0DBCF] rounded-lg text-xs font-medium text-[#1A1A1A] placeholder:text-[#B0ADA9] outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[#1A1A1A]">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote, SF"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-[#E0DBCF] rounded-lg text-xs font-medium text-[#1A1A1A] placeholder:text-[#B0ADA9] outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#1A1A1A]">Initial Stage</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as StageId)}
                    className="w-full mt-1 px-3 py-2 border border-[#E0DBCF] rounded-lg text-xs font-medium text-[#1A1A1A] outline-none focus:border-primary bg-white"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#1A1A1A]">Job URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newJdUrl}
                  onChange={(e) => setNewJdUrl(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-[#E0DBCF] rounded-lg text-xs font-medium text-[#1A1A1A] placeholder:text-[#B0ADA9] outline-none focus:border-primary"
                />
              </div>

              {resumes.length > 0 && (
                <div>
                  <label className="text-[11px] font-medium text-[#1A1A1A]">Resume Used</label>
                  <select
                    value={newResumeVersion}
                    onChange={(e) => setNewResumeVersion(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-[#E0DBCF] rounded-lg text-xs font-medium text-[#1A1A1A] outline-none focus:border-primary bg-white"
                  >
                    <option value="">None selected</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.title}>{r.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="text-xs h-9 border-[#E0DBCF]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-primary hover:bg-[#25A87A] text-white text-xs h-9 px-4 cursor-pointer"
                >
                  {createMutation.isPending ? "Adding…" : "Save Application"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Detail Modal */}
        <Dialog open={!!selectedApp} onOpenChange={(open) => { if (!open) handleCloseDetails(); }}>
          <DialogContent className="w-[94%] max-w-[480px] border-[#E0DBCF] bg-white p-5 sm:p-6 rounded-2xl text-left shadow-xl">
            {selectedApp && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CompanyLogo company={selectedApp.company} size={40} />
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-base font-semibold text-[#1A1A1A] truncate">
                      {selectedApp.role}
                    </DialogTitle>
                    <p className="text-xs text-[#6B6760] mt-0.5">
                      {selectedApp.company} {selectedApp.location && `· ${selectedApp.location}`}
                    </p>
                  </div>
                </div>

                {/* Stage selector */}
                <div>
                  <label className="text-[11px] font-medium text-[#6B6760] block mb-1.5">Pipeline Stage</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STAGES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (selectedApp.stage === s.id) return;
                          const prevStage = selectedApp.stage;
                          updateMutation.mutate({ id: selectedApp.id, data: { stage: s.id } });
                          notify.success(`Moved to ${s.label}`, {
                            action: {
                              label: "Undo",
                              onClick: () => updateMutation.mutate({ id: selectedApp.id, data: { stage: prevStage } }),
                            },
                          });
                        }}
                        className="text-xs px-2.5 py-1 rounded-full font-medium border transition-colors cursor-pointer"
                        style={
                          selectedApp.stage === s.id
                            ? { background: s.color, color: "#fff", borderColor: s.color }
                            : { background: s.bg, color: s.color, borderColor: "transparent" }
                        }
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedApp.resume_version_used && (
                  <div className="text-xs text-[#6B6760] pt-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#B0ADA9]" />
                    <span>Resume: <strong>{getResumeLabel(selectedApp.resume_version_used)}</strong></span>
                  </div>
                )}

                {selectedApp.jd_url && (
                  <div className="pt-1">
                    <a href={selectedApp.jd_url} target="_blank" rel="noreferrer" className="text-xs text-[#1A1A1A] underline flex items-center gap-1">
                      <span>View job posting</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-medium text-[#1A1A1A]">Interview &amp; Application Notes</label>
                  <Textarea
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    placeholder="Enter notes, interview details, or updates…"
                    className="text-xs min-h-[100px] resize-none border-outly-border bg-outly-cream"
                  />
                </div>

                <div className="pt-3 border-t border-[#E0DBCF] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                  <Button onClick={handleCloseDetails} className="bg-[#1A1A1A] hover:bg-black text-white text-xs h-8 px-4 rounded-full">
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent className="max-w-[360px] p-5 rounded-2xl border-[#E0DBCF]">
            <AlertDialogHeader className="text-left space-y-1">
              <AlertDialogTitle className="text-sm font-semibold text-[#1A1A1A]">Delete Application?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-[#6B6760]">
                Are you sure you want to remove this application from your tracker? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center justify-end gap-2 mt-4">
              <AlertDialogCancel className="text-xs h-8 border-[#E0DBCF] rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedApp && deleteMutation.mutate(selectedApp.id)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 rounded-full"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ─── Mobile View ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="w-full pb-20 font-rubik text-left">
        <div className="p-4 flex items-center justify-between border-b border-[#E0DBCF]">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">Job Tracker</h1>
            <p className="text-xs text-[#6B6760] mt-0.5">{apps.length} applications in progress</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-white text-xs font-medium cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Mobile Stage Selector Tabs */}
        <div className="px-4 py-2.5 overflow-x-auto scrollbar-none border-b border-[#E0DBCF]/60">
          <div className="flex gap-2">
            {STAGES.map((stage, idx) => {
              const count = filteredApps.filter((a) => a.stage === stage.id).length;
              const isActive = idx === mobileStageIdx;
              return (
                <button
                  key={stage.id}
                  onClick={() => setMobileStageIdx(idx)}
                  className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer"
                  style={
                    isActive
                      ? { background: stage.color, color: "#fff" }
                      : { background: stage.bg, color: stage.color }
                  }
                >
                  <span>{stage.label}</span>
                  <span
                    className="font-medium text-[10px] rounded-full px-1.5 py-0 leading-4"
                    style={isActive ? { background: "rgba(255,255,255,0.25)" } : { background: "rgba(0,0,0,0.06)" }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards */}
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size={24} className="text-[#6B6760]" />
            </div>
          ) : stageApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-[#E0DBCF] text-[#B0ADA9]">
              <Briefcase className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">No applications in {currentStage.label}</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {stageApps.map((app) => (
                <m.div
                  key={app.id}
                  layout
                  layoutId={`app-card-${app.id}`}
                  transition={spring.snappy}
                  className="bg-white rounded-xl border border-[#E0DBCF] shadow-sm overflow-hidden"
                >
                  <div className="p-4 cursor-pointer" onClick={() => setSelectedApp(app)}>
                    <div className="flex items-start gap-3">
                      <CompanyLogo company={app.company} size={32} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[#1A1A1A] truncate">{app.role}</h3>
                        <p className="text-xs text-[#6B6760] mt-0.5 truncate">{app.company} · {getRelativeTime(app.createdAt || (app as any).created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex border-t border-[#E0DBCF]/60">
                    <button
                      type="button"
                      onClick={() => moveAppToStage(app.id, "prev")}
                      disabled={mobileStageIdx === 0}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-[#6B6760] disabled:opacity-30 cursor-pointer border-r border-[#E0DBCF]/60"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAppToStage(app.id, "next")}
                      disabled={mobileStageIdx === STAGES.length - 1}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-[#6B6760] disabled:opacity-30 cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </m.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {renderDialogs()}
      </div>
    );
  }

  // ─── Desktop 5-Stage Kanban Board ──────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-24 text-left font-rubik">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E0DBCF]">
        <div>
          <div className="hidden sm:inline-flex items-center gap-1.5 mb-1 text-primary">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#6B6760]">
              Jobs / Tracker
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-[#1A1A1A] tracking-tight mt-1">Applications</h1>
          <p className="text-xs text-[#6B6760] font-normal mt-1">
            Drag cards between stages. {apps.length} application{apps.length === 1 ? "" : "s"} in progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#B0ADA9] absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search company or role…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-[#E0DBCF] bg-white rounded-lg pl-8 pr-3 py-2 text-xs font-medium text-[#1A1A1A] placeholder:text-[#B0ADA9] outline-none focus:border-primary w-48 sm:w-56 shadow-xs"
            />
          </div>
          <m.button
            type="button"
            onClick={() => setIsAddOpen(true)}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: dur.instant }}
            className="bg-primary hover:bg-[#25A87A] text-white px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add application</span>
          </m.button>
        </div>
      </div>

      {/* Kanban Columns */}
      {isLoading ? (
        <div className="flex justify-center py-24 bg-white border border-[#E0DBCF] rounded-2xl">
          <Spinner size={28} className="text-[#6B6760]" />
        </div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-[#E0DBCF] bg-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-outly-border/40 flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-[#6B6760]" />
          </div>
          <h3 className="text-base font-semibold text-[#1A1A1A]">No applications yet</h3>
          <p className="text-xs text-[#6B6760] mt-1 max-w-[260px]">
            Track every job you apply to — from saved to offer.
          </p>
          <m.button
            type="button"
            onClick={() => setIsAddOpen(true)}
            whileTap={{ scale: 0.98 }}
            className="mt-5 bg-primary hover:bg-[#25A87A] text-white px-5 py-2.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add your first application</span>
          </m.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-start">
          {STAGES.map((stage) => {
            const columnApps = filteredApps.filter((a) => a.stage === stage.id);
            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="bg-outly-border/20 rounded-2xl border border-outly-border p-3 flex flex-col min-h-[520px] transition-colors"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1 mb-3 select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-semibold text-[#1A1A1A]">{stage.label}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#B0ADA9] font-normal">
                    {String(columnApps.length).padStart(2, "0")}
                  </span>
                </div>

                {columnApps.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-[#B0ADA9] select-none border border-dashed border-[#E0DBCF] rounded-xl">
                    Drop cards here
                  </div>
                ) : (
                  <div className="space-y-2.5 flex-1">
                    <AnimatePresence mode="popLayout">
                      {columnApps.map((app) => {
                        const resumeLabel = getResumeLabel(app.resume_version_used);
                        const displayTime = getRelativeTime(app.createdAt || (app as any).created_at);
                        const displayDate = formatCardDate(app.createdAt || (app as any).created_at);
                        return (
                          <m.div
                            key={app.id}
                            layout
                            layoutId={`app-card-${app.id}`}
                            variants={staggerItem}
                            transition={spring.snappy}
                            draggable
                            onDragStart={(e) => handleDragStart(e, app.id)}
                            onClick={() => setSelectedApp(app)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white rounded-xl p-3.5 border border-[#E0DBCF] shadow-xs hover:border-[#1A1A1A]/30 transition-colors cursor-pointer group text-left select-none"
                          >
                            <CompanyLogo company={app.company} size={24} />
                            <h3 className="text-xs font-semibold text-[#1A1A1A] mt-2.5 truncate">{app.role}</h3>
                            <p className="text-[11px] text-[#6B6760] mt-0.5 truncate font-normal">{app.company} · {displayTime}</p>
                            <div className="flex items-center justify-between text-[10px] text-[#B0ADA9] font-normal mt-3.5 pt-2 border-t border-[#E0DBCF]/60">
                              <span>{displayDate}</span>
                              <span className="max-w-[110px] truncate text-right">
                                {resumeLabel ? (resumeLabel.length > 14 ? `${resumeLabel.slice(0, 14)}…` : resumeLabel)
                                  : app.notes ? "Notes" : ""}
                              </span>
                            </div>
                          </m.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {renderDialogs()}
    </div>
  );
}
