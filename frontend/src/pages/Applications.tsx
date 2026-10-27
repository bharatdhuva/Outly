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
  Loader2,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from "lucide-react";

const STAGES = [
  { id: "saved",     label: "Saved",     color: "#6366f1", bg: "#eef2ff" },
  { id: "applied",   label: "Applied",   color: "#0ea5e9", bg: "#e0f2fe" },
  { id: "interview", label: "Interview", color: "#f59e0b", bg: "#fef3c7" },
  { id: "offer",     label: "Offer",     color: "#10b981", bg: "#d1fae5" },
  { id: "rejected",  label: "Rejected",  color: "#ef4444", bg: "#fee2e2" },
] as const;

type StageId = typeof STAGES[number]["id"];

// ── Company Logo: Clearbit with initial letter fallback ──────────────────────
function CompanyLogo({ company, size = 28 }: { company: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initial = company.trim().charAt(0).toUpperCase();

  // Derive a domain guess from the company name for Clearbit
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
        className="rounded-lg bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center justify-center shrink-0 select-none"
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
      className="rounded-lg object-contain shrink-0 bg-white border border-neutral-100"
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

  // Mobile stage filter (which stage column to show)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobileStageIdx, setMobileStageIdx] = useState(0);

  // New Application form state
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newJdUrl, setNewJdUrl] = useState("");
  const [newStage, setNewStage] = useState<StageId>("saved");
  const [newResumeUsed, setNewResumeUsed] = useState<string>("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { data: serverApps = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: api.applications.list,
  });

  const { data: resumes = [] } = useQuery({
    queryKey: ["resume", "list"],
    queryFn: api.resume.list,
  });

  // All data comes from the user's own database — no demo/placeholder fallback
  const apps: TrackerApplication[] = serverApps;

  useEffect(() => {
    if (selectedApp) setLocalNotes(selectedApp.notes || "");
  }, [selectedApp]);

  useEffect(() => {
    if (resumes.length > 0 && !newResumeUsed) {
      const def = resumes.find((r: any) => r.is_default === 1);
      if (def) setNewResumeUsed(String(def.id));
    }
  }, [resumes]);

  const createMutation = useMutation({
    mutationFn: api.applications.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      setIsAddOpen(false);
      if (variables.stage) {
        const stageIdx = STAGES.findIndex((s) => s.id === variables.stage);
        if (stageIdx !== -1) setMobileStageIdx(stageIdx);
      }
      setNewCompany(""); setNewRole(""); setNewJdUrl(""); setNewStage("saved");
      const def = resumes.find((r: any) => r.is_default === 1);
      setNewResumeUsed(def ? String(def.id) : "");
      notify.success("Application added");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TrackerApplication> }) =>
      api.applications.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["applications"] });
      const prev = queryClient.getQueryData<TrackerApplication[]>(["applications"]);
      if (prev) {
        queryClient.setQueryData<TrackerApplication[]>(
          ["applications"],
          prev.map((app) => (app.id === id ? { ...app, ...data } : app))
        );
      }
      if (data.stage) {
        const stageIdx = STAGES.findIndex((s) => s.id === data.stage);
        if (stageIdx !== -1) setMobileStageIdx(stageIdx);
      }
      return { prev };
    },
    onError: () => {
      notify.error("Update failed");
    },
    onSuccess: (_, variables) => {
      if (selectedApp?.id === variables.id) {
        const updated = apps.find((a) => a.id === variables.id);
        if (updated) setSelectedApp({ ...updated, ...variables.data });
      }
      if (variables.data.stage) {
        const stageIdx = STAGES.findIndex((s) => s.id === variables.data.stage);
        if (stageIdx !== -1) setMobileStageIdx(stageIdx);
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
      setDeleteConfirmOpen(false);
      notify.success("Application deleted");
    },
  });

  // Desktop drag-and-drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, targetStage: StageId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const app = apps.find((a) => a.id === id);
    if (!app || app.stage === targetStage) return;
    const prevStage = app.stage;
    updateMutation.mutate({ id, data: { stage: targetStage } });
    const targetObj = STAGES.find((s) => s.id === targetStage);
    notify.success(`Moved to ${targetObj?.label || targetStage}`, {
      action: {
        label: "Undo",
        onClick: () => {
          updateMutation.mutate({ id, data: { stage: prevStage } });
          const prevIdx = STAGES.findIndex((s) => s.id === prevStage);
          if (prevIdx !== -1) setMobileStageIdx(prevIdx);
        },
      },
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) {
      return;
    }
    createMutation.mutate({
      company: newCompany, role: newRole, jd_url: newJdUrl, stage: newStage,
      resume_version_used: newResumeUsed || null, notes: null, email_history: "[]",
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

  const getResumeLabel = (resumeIdOrLabel: string | null) => {
    if (!resumeIdOrLabel) return null;
    const found = resumes.find((r: any) => String(r.id) === String(resumeIdOrLabel));
    return found ? found.label : resumeIdOrLabel;
  };

  // Mobile: move a card to next/prev stage
  const moveAppToStage = (appId: string, direction: "next" | "prev") => {
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    const prevStage = app.stage;
    const currIdx = STAGES.findIndex((s) => s.id === prevStage);
    const nextIdx = direction === "next" ? currIdx + 1 : currIdx - 1;
    if (nextIdx < 0 || nextIdx >= STAGES.length) return;
    const nextStage = STAGES[nextIdx].id;
    setMobileStageIdx(nextIdx);
    updateMutation.mutate({ id: appId, data: { stage: nextStage } });
    notify.success(`Moved to ${STAGES[nextIdx].label}`, {
      action: {
        label: "Undo",
        onClick: () => {
          updateMutation.mutate({ id: appId, data: { stage: prevStage } });
          const prevIdx = STAGES.findIndex((s) => s.id === prevStage);
          if (prevIdx !== -1) setMobileStageIdx(prevIdx);
        },
      },
    });
  };

  useEffect(() => {
    if (isMobile) {
      const activeTab = document.getElementById(`mobile-stage-tab-${STAGES[mobileStageIdx]?.id}`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [mobileStageIdx, isMobile]);

  // ─── Mobile View ──────────────────────────────────────────────────────────
  if (isMobile) {
    const currentStage = STAGES[mobileStageIdx];
    const stageApps = filteredApps.filter((a) => a.stage === currentStage.id);

    return (
      <div className="w-full min-h-screen pb-24 text-left font-sans">

        {/* ── Header ── */}
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Applications</h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">{apps.length} applications in progress</p>
        </div>

        {/* ── Search + Add ── */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Enter company or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-neutral-200 bg-white rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-neutral-400 shadow-xs"
            />
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#121212] text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* ── Stage Tabs Bar ── */}
        <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200/70 shadow-xs">
          <div
            className="flex overflow-x-auto px-4 gap-1 scrollbar-none py-2"
            style={{ scrollbarWidth: "none" }}
          >
            {STAGES.map((stage, idx) => {
              const count = filteredApps.filter((a) => a.stage === stage.id).length;
              const isActive = idx === mobileStageIdx;
              return (
                <button
                  key={stage.id}
                  id={`mobile-stage-tab-${stage.id}`}
                  onClick={() => setMobileStageIdx(idx)}
                  className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer"
                  style={
                    isActive
                      ? { background: stage.color, color: "#fff" }
                      : { background: stage.bg, color: stage.color }
                  }
                >
                  <span>{stage.label}</span>
                  <span
                    className="font-bold text-[10px] rounded-full px-1.5 py-0 leading-4"
                    style={isActive ? { background: "rgba(255,255,255,0.25)" } : { background: "rgba(0,0,0,0.08)" }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Stage Prev/Next Navigation ── */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileStageIdx((p) => Math.max(0, p - 1))}
            disabled={mobileStageIdx === 0}
            className="flex items-center gap-1 text-[11px] font-semibold text-neutral-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            {mobileStageIdx > 0 ? STAGES[mobileStageIdx - 1].label : ""}
          </button>

          <div className="flex items-center gap-1.5">
            {STAGES.map((_, i) => (
              <div
                key={i}
                onClick={() => setMobileStageIdx(i)}
                className="w-1.5 h-1.5 rounded-full cursor-pointer transition-all"
                style={{ background: i === mobileStageIdx ? currentStage.color : "#d4d4d4" }}
              />
            ))}
          </div>

          <button
            onClick={() => setMobileStageIdx((p) => Math.min(STAGES.length - 1, p + 1))}
            disabled={mobileStageIdx === STAGES.length - 1}
            className="flex items-center gap-1 text-[11px] font-semibold text-neutral-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            {mobileStageIdx < STAGES.length - 1 ? STAGES[mobileStageIdx + 1].label : ""}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Stage Label ── */}
        <div className="px-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: currentStage.color }} />
            <span className="text-sm font-bold text-neutral-900">{currentStage.label}</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            {String(stageApps.length).padStart(2, "0")}
          </span>
        </div>

        {/* ── Cards ── */}
        <div className="px-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-neutral-400" />
            </div>
          ) : stageApps.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-neutral-200 text-neutral-400"
            >
              <Briefcase className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs font-medium">No applications in {currentStage.label}</p>
              <p className="text-[10px] mt-1 opacity-70">Move cards here or add a new one</p>
            </div>
          ) : (
            stageApps.map((app) => {
              const resumeLabel = getResumeLabel(app.resume_version_used);
              const displayTime = getRelativeTime(app.createdAt || (app as any).created_at);
              const displayDate = formatCardDate(app.createdAt || (app as any).created_at);
              const currStageIdx = STAGES.findIndex((s) => s.id === app.stage);

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden"
                >
                  {/* Card body */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setSelectedApp(app)}
                  >
                    <div className="flex items-start gap-3">
                      <CompanyLogo company={app.company} size={36} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-neutral-900 leading-tight truncate">{app.role}</h3>
                        <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{app.company} · {displayTime}</p>
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                        style={{ background: currentStage.bg, color: currentStage.color }}
                      >
                        {currentStage.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-100 text-[10px] text-neutral-400">
                      <span>{displayDate}</span>
                      <span className="max-w-[120px] truncate text-right">
                        {resumeLabel ? (resumeLabel.length > 16 ? `${resumeLabel.slice(0, 16)}…` : resumeLabel)
                          : app.notes ? "Notes" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Move to stage buttons */}
                  <div className="flex border-t border-neutral-100">
                    <button
                      onClick={() => moveAppToStage(app.id, "prev")}
                      disabled={currStageIdx === 0}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-neutral-50 transition-colors border-r border-neutral-100"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      {currStageIdx > 0 ? STAGES[currStageIdx - 1].label : ""}
                    </button>
                    <button
                      onClick={() => moveAppToStage(app.id, "next")}
                      disabled={currStageIdx === STAGES.length - 1}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-neutral-50 transition-colors"
                      style={currStageIdx < STAGES.length - 1 ? { color: STAGES[currStageIdx + 1].color } : {}}
                    >
                      {currStageIdx < STAGES.length - 1 ? STAGES[currStageIdx + 1].label : ""}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── DIALOGS ─── */}
        {renderDialogs()}
      </div>
    );
  }

  // ─── Desktop Kanban View ─────────────────────────────────────────────────
  function renderDialogs() {
    return (
      <>
        {/* Add Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="w-[94%] max-w-[440px] border-neutral-200 bg-white p-4 sm:p-6 rounded-2xl text-left max-h-[calc(var(--visual-viewport-height,100dvh)-2rem)] sm:max-h-[88vh] overflow-y-auto modal-scroll">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base font-bold text-neutral-900">Add Application</DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Track a new job opportunity in your pipeline.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 mt-2">
              {[
                { label: "Company *", value: newCompany, setter: setNewCompany, placeholder: "Enter company name", required: true, type: "text" },
                { label: "Role *", value: newRole, setter: setNewRole, placeholder: "Enter role", required: true, type: "text" },
                { label: "Job Posting Link (Optional)", value: newJdUrl, setter: setNewJdUrl, placeholder: "Enter job posting link", required: false, type: "url" },
              ].map(({ label, value, setter, placeholder, required, type }) => (
                <div key={label} className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-700">{label}</label>
                  <input
                    required={required}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-neutral-400"
                  />
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-700">Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as StageId)}
                  className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-neutral-400 bg-white"
                >
                  {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-700">Resume Version Used</label>
                <select
                  value={newResumeUsed}
                  onChange={(e) => setNewResumeUsed(e.target.value)}
                  className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-neutral-400 bg-white"
                >
                  <option value="">None selected</option>
                  {resumes.map((r: any) => <option key={r.id} value={String(r.id)}>{r.label}</option>)}
                </select>
              </div>

              <DialogFooter className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="text-xs h-9 border-neutral-200">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-black hover:bg-neutral-800 text-white text-xs h-9">
                  {createMutation.isPending ? "Adding..." : "Add to Tracker"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={!!selectedApp} onOpenChange={(open) => !open && handleCloseDetails()}>
          <DialogContent className="w-[94%] max-w-[480px] border-neutral-200 bg-white p-4 sm:p-6 rounded-2xl text-left max-h-[calc(var(--visual-viewport-height,100dvh)-2rem)] sm:max-h-[88vh] overflow-y-auto modal-scroll">
            {selectedApp && (
              <div className="space-y-4">
                <DialogHeader className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CompanyLogo company={selectedApp.company} size={36} />
                    <div>
                      <DialogTitle className="text-base font-bold text-neutral-900 leading-tight">
                        {selectedApp.role}
                      </DialogTitle>
                      <p className="text-xs text-neutral-500 font-normal">{selectedApp.company}</p>
                    </div>
                  </div>
                </DialogHeader>

                {/* Stage Switcher */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-700">Stage</label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {STAGES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (selectedApp.stage === s.id) return;
                          const prevStage = selectedApp.stage;
                          const sIdx = STAGES.findIndex((st) => st.id === s.id);
                          if (sIdx !== -1) setMobileStageIdx(sIdx);
                          updateMutation.mutate({ id: selectedApp.id, data: { stage: s.id } });
                          notify.success(`Moved to ${s.label}`, {
                            action: {
                              label: "Undo",
                              onClick: () => {
                                updateMutation.mutate({ id: selectedApp.id, data: { stage: prevStage } });
                                const prevIdx = STAGES.findIndex((st) => st.id === prevStage);
                                if (prevIdx !== -1) setMobileStageIdx(prevIdx);
                              },
                            },
                          });
                        }}
                        className="text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors cursor-pointer"
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

                {/* Resume */}
                {selectedApp.resume_version_used && (
                  <div className="text-xs text-neutral-600 pt-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Resume used: <strong>{getResumeLabel(selectedApp.resume_version_used)}</strong></span>
                  </div>
                )}

                {/* Job Link */}
                {selectedApp.jd_url && (
                  <div className="pt-1">
                    <a href={selectedApp.jd_url} target="_blank" rel="noreferrer" className="text-xs text-neutral-900 underline flex items-center gap-1">
                      <span>View original job posting</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-neutral-700">Interview & Application Notes</label>
                  <Textarea
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    placeholder="Enter notes, interview details, or updates..."
                    className="text-xs min-h-[110px] resize-none border-neutral-200 bg-neutral-50/50"
                  />
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                  <Button onClick={handleCloseDetails} className="bg-black hover:bg-neutral-800 text-white text-xs h-8 px-4">
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent className="max-w-[360px] p-5 rounded-xl border-neutral-200">
            <AlertDialogHeader className="text-left space-y-1">
              <AlertDialogTitle className="text-sm font-bold text-neutral-900">Delete Application?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-neutral-500">
                Are you sure you want to remove this application from your tracker? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center justify-end gap-2 mt-4">
              <AlertDialogCancel className="text-xs h-8 border-neutral-200">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedApp && deleteMutation.mutate(selectedApp.id)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in pb-24 text-left">

      {/* ─── TOP HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200/70">
        <div>
          <div className="hidden sm:inline-flex items-center gap-2 mb-1">
            <Briefcase className="w-3.5 h-3.5 text-[#2DC08D]" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Jobs / Tracker
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mt-1.5">Applications</h1>
          <p className="text-xs sm:text-[13px] text-neutral-500 font-normal mt-1">
            {apps.length === 0
              ? "Track every job you apply to — from saved to offer."
              : `Drag a card to move it between stages. ${apps.length} application${apps.length === 1 ? "" : "s"} in progress.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Enter company or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-neutral-200/90 bg-white rounded-lg pl-8 pr-3 py-2 text-xs font-medium text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-neutral-400 w-48 sm:w-56 shadow-2xs"
            />
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#121212] hover:bg-black text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add application</span>
          </button>
        </div>
      </div>

      {/* ─── 5-STAGE KANBAN BOARD ─── */}
      {isLoading ? (
        <div className="flex justify-center py-24 bg-white border border-neutral-200/70 rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-800" />
        </div>
      ) : apps.length === 0 ? (
        /* ─── Global Empty State for new users ─── */
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-neutral-200 bg-[#fafaf9] text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5">
            <Briefcase className="w-7 h-7 text-neutral-400" />
          </div>
          <h3 className="text-base font-bold text-neutral-800">No applications yet</h3>
          <p className="text-xs text-neutral-500 mt-1.5 max-w-[260px]">
            Start tracking your job search. Add your first application to get started.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-6 bg-[#121212] hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add your first application
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-start">
          {STAGES.map((stage) => {
            const stageApps = filteredApps.filter((a) => a.stage === stage.id);
            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="bg-[#f6f5f3] rounded-2xl border border-neutral-200/60 p-3.5 flex flex-col min-h-[540px] transition-colors"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1 mb-3 select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-semibold text-neutral-800">{stage.label}</span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400 font-normal">
                    {String(stageApps.length).padStart(2, "0")}
                  </span>
                </div>

                {stageApps.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-neutral-400 select-none border-2 border-dashed border-neutral-200/80 rounded-xl">
                    Drop cards here
                  </div>
                ) : (
                  <div className="space-y-3 flex-1">
                    {stageApps.map((app) => {
                      const resumeLabel = getResumeLabel(app.resume_version_used);
                      const displayTime = getRelativeTime(app.createdAt || (app as any).created_at);
                      const displayDate = formatCardDate(app.createdAt || (app as any).created_at);
                      return (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          onClick={() => setSelectedApp(app)}
                          className="bg-white rounded-xl p-3.5 border border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-neutral-300 transition-all cursor-pointer group text-left"
                        >
                          <CompanyLogo company={app.company} size={24} />
                          <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900 mt-2.5 truncate">{app.role}</h3>
                          <p className="text-[11px] text-neutral-500 mt-0.5 truncate font-normal">{app.company} · {displayTime}</p>
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-normal mt-4 pt-2 border-t border-neutral-100">
                            <span>{displayDate}</span>
                            <span className="max-w-[110px] truncate text-right">
                              {resumeLabel ? (resumeLabel.length > 14 ? `${resumeLabel.slice(0, 14)}...` : resumeLabel)
                                : app.notes ? "Notes" : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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
