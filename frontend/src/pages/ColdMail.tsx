import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DotLottieLoader from "@/components/DotLottieLoader";
import AiErrorModal from "@/components/AiErrorModal";
import {
  Mail,
  Upload,
  Plus,
  Check,
  SkipForward,
  Send,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Building2,
  User,
  ExternalLink,
  MapPin,
  Wrench,
  GraduationCap,
  Eye,
  Trash2,
  Edit,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { api, type Company } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const GmailIcon = () => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
    alt="Gmail"
    className="h-5 w-5 shrink-0 object-contain"
  />
);

const pipelineSteps = [
  { key: "pending", label: "Pending" },
  { key: "scraped", label: "Scraped" },
  { key: "mail_generated", label: "Generated" },
  { key: "approved", label: "Approved" },
  { key: "mail_sent", label: "Sent" },
];

const pipelineOrder = [
  "pending",
  "scraped",
  "mail_generated",
  "approved",
  "mail_sent",
];

export default function ColdMailPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistent states stored in sessionStorage
  const [selected, setSelected] = useState<string | null>(() => {
    return sessionStorage.getItem("cm_selected") || null;
  });
  const [mainMode, setMainMode] = useState<"manual" | "csv">(() => {
    const val = sessionStorage.getItem("cm_mainMode");
    return (val as "manual" | "csv") || "manual";
  });
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<"formal" | "casual" | "short">(() => {
    const val = sessionStorage.getItem("cm_activeTab");
    return (val as "formal" | "casual" | "short") || "formal";
  });
  const [showFollowUps, setShowFollowUps] = useState<boolean>(() => {
    return sessionStorage.getItem("cm_showFollowUps") === "true";
  });
  const [companySize, setCompanySize] = useState<"startup" | "mid" | "large">("startup");
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    company_name: "",
    website_url: "",
    hr_email: "",
    role: "Software Development Engineer",
    target_person_name: "",
    target_person_role: "",
    key_skills: "React, TypeScript, Node.js",
    experience_level: "",
    sender_name: "",
    sender_location: "",
    personalization_hook: "",
  });
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<string>("gemini");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Company>>({});
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [showSettingsPrompt, setShowSettingsPrompt] = useState(false);
  const [showAiErrorModal, setShowAiErrorModal] = useState(false);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState<boolean>(() => {
    return sessionStorage.getItem("cm_mobileDetailsOpen") === "true";
  });

  // Sync states to sessionStorage on changes
  useEffect(() => {
    if (selected !== null) {
      sessionStorage.setItem("cm_selected", selected.toString());
    } else {
      sessionStorage.removeItem("cm_selected");
    }
  }, [selected]);

  useEffect(() => {
    sessionStorage.setItem("cm_mainMode", mainMode);
  }, [mainMode]);

  useEffect(() => {
    sessionStorage.setItem("cm_activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem("cm_showFollowUps", showFollowUps ? "true" : "false");
  }, [showFollowUps]);

  useEffect(() => {
    sessionStorage.setItem("cm_mobileDetailsOpen", mobileDetailsOpen ? "true" : "false");
  }, [mobileDetailsOpen]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto-close details view if transitioning to desktop
      if (!mobile) {
        setMobileDetailsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });

  const handleGenerateCheck = (action: () => void) => {
    if (!settings?.full_name || !settings?.skills || !settings?.experience) {
      setShowSettingsPrompt(true);
      return;
    }
    action();
  };

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["coldmail", "companies"],
    queryFn: api.coldmail.companies,
    refetchInterval: 5000,
  });

  const selectedCompany = companies.find((c: Company) => c.id === selected);

  useEffect(() => {
    if (selected === null && companies.length > 0) {
      setSelected(companies[0].id);
    }
  }, [companies, selected]);

  useEffect(() => {
    if (!settings) return;
    setNewCompany((current) => ({
      ...current,
      role: settings.target_role || current.role || "Software Development Engineer",
      key_skills: settings.skills || current.key_skills || "React, TypeScript, Node.js",
      experience_level: settings.experience || current.experience_level || "",
      sender_name: settings.full_name || current.sender_name || "",
      sender_location: settings.target_cities?.split(",")[0]?.trim() || current.sender_location || "",
    }));
  }, [settings]);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.coldmail.uploadCsv(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coldmail"] });
      toast.success(`Imported ${data.imported} companies`);
    },
    onError: (e) => toast.error(String(e)),
  });

  const createMutation = useMutation({
    mutationFn: api.coldmail.create,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["coldmail"] });
      setIsAdding(false);
      // Auto-select the newly created company
      if (data?.id) {
        setSelected(String(data.id));
        if (isMobile) setMobileDetailsOpen(true);
      }
      setNewCompany({
        company_name: "",
        website_url: "",
        hr_email: "",
        role: settings?.target_role || "Software Development Engineer",
        target_person_name: "",
        target_person_role: "",
        key_skills: settings?.skills || "React, TypeScript, Node.js",
        experience_level: settings?.experience || "",
        sender_name: settings?.full_name || "",
        sender_location: settings?.target_cities?.split(",")[0]?.trim() || "",
        personalization_hook: "",
      });
      toast.success("Lead added successfully");
    },
    onError: (e) => toast.error(String(e)),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.coldmail.generateAll("gemini", "gemini-2.5-flash"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coldmail"] });
      toast.success(`Generated ${data.generated} mails`);
    },
    onError: (e) => {
      const errStr = String(e);
      if (errStr.includes("Gemini") || errStr.includes("GoogleGenerativeAI") || errStr.includes("evaluations failed") || errStr.includes("rate limit") || errStr.includes("404")) {
        setShowAiErrorModal(true);
      } else {
        toast.error(errStr);
      }
    },
  });

  const approveAllMutation = useMutation({
    mutationFn: () => api.coldmail.approveAll(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coldmail"] });
      toast.success(`Approved ${data.approved} mails`);
    },
  });

  const approveSingleMutation = useMutation({
    mutationFn: (id: string) => api.coldmail.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coldmail"] });
      toast.success("Lead approved successfully");
    },
    onError: (e) => toast.error(String(e)),
  });

  const sendApprovedMutation = useMutation({
    mutationFn: () => api.coldmail.sendApproved(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coldmail"] });
      toast.success(`Queued ${data.queued} mails`);
    },
    onError: (e) => toast.error(String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.coldmail.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coldmail"] });
      if (selected && companies.find((c: Company) => c.id === selected)) {
        setSelected(null);
      }
      toast.success("Lead deleted");
    },
    onError: (e) => toast.error(String(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) =>
      api.coldmail.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coldmail"] });
      toast.success("Lead updated");
    },
    onError: (e) => toast.error(String(e)),
  });

  const counts = {
    pending: companies.filter((c: Company) => c.status === "pending").length,
    approved: companies.filter((c: Company) => c.status === "approved").length,
    sent: companies.filter((c: Company) =>
      ["mail_sent", "replied"].includes(c.status),
    ).length,
    replied: companies.filter((c: Company) => c.status === "replied").length,
  };

  const getCurrentStepIndex = (status: string) => {
    const idx = pipelineOrder.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = "";
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newCompany);
  };

  const handleCreateClick = () => {
    createMutation.mutate(newCompany);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading)
    return <DotLottieLoader minHeight="min-h-[400px]" />;

  // Helper to ensure proper formatting, greeting, paragraph separation, and sign-off in cold mail draft
  function cleanDraft(draft: string, company?: Company | null): string {
    if (!draft) return "";
    let text = draft.trim();

    // 1. Fix punctuation stuck directly to uppercase letters without spaces or line breaks (e.g. "resonates.As", "agencies.I'm")
    text = text.replace(/([.!?])([A-Z])/g, "$1\n\n$2");
    text = text.replace(/\r\n/g, "\n");

    // 2. Remove accidental duplicate headers like "SUBJECT: ...\nBODY:"
    text = text.replace(/^(subject:.*?\n+|body:\s*)+/gi, "");

    // 3. Remove repeated paragraphs
    const seen = new Set<string>();
    const uniqueParas = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => {
        if (!p || seen.has(p)) return false;
        seen.add(p);
        return true;
      });

    let formatted = uniqueParas.join("\n\n");

    // 4. Ensure greeting at the beginning
    const hasGreeting = /^(hi|hey|hello|dear)\b/i.test(formatted.trim());
    if (!hasGreeting) {
      const recipient = company?.target_person_name?.trim() || (company?.company_name ? `${company.company_name} Team` : "Hiring Team");
      formatted = `Hi ${recipient},\n\n${formatted}`;
    }

    // 5. Ensure professional sign-off at the end
    const hasSignOff = /(best regards|warm regards|kind regards|regards|sincerely|best,)\s*\n?/i.test(formatted);
    if (!hasSignOff) {
      const sender = company?.sender_name?.trim() || settings?.full_name?.trim() || "Bharat Dhuva";
      const location = company?.sender_location?.trim() || settings?.target_cities?.split(",")[0]?.trim() || "";
      formatted = `${formatted}\n\nBest regards,\n${sender}${location ? `\n${location}` : ""}`;
    }

    return formatted;
  }

  return (
    <>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-border bg-card max-w-[340px] p-5 rounded-2xl gap-0">
          <AlertDialogHeader className="pb-0 space-y-1">
            <AlertDialogTitle className="text-base font-bold text-foreground">Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {deleteTarget
                ? `This will permanently remove ${deleteTarget.company_name} from your cold mail pipeline.`
                : "This will permanently remove this lead from your cold mail pipeline."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2.5 mt-5">
            <AlertDialogCancel className="flex-1 h-9 rounded-xl text-xs font-bold border-border text-foreground hover:bg-secondary cursor-pointer m-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 h-9 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer m-0"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── MAIN CONTENT CONTAINER (MATCHING RESUME VAULT & JOB SEARCH) ─── */}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-8 space-y-6 animate-fade-in pb-20 text-left font-sans">

        {/* Top Header matching ResumeVault, JobSearch, AtsScore & ResumeTailor */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-left">
          <div>
            <div className="hidden sm:inline-flex items-center gap-2 mb-1">
              <Mail className="w-3.5 h-3.5 text-[#2DC08D]" />
              <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Tools / Cold Mail
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mt-1.5">
              Cold Mail Outreach
            </h1>
            <p className="text-[13px] text-neutral-500 font-normal mt-1 max-w-2xl">
              Generate personalized recruiter outreach, research company profiles, and automate follow-up sequences.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />

            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="self-start inline-flex items-center justify-center gap-1.5 bg-[#111111] hover:bg-black text-white px-4 py-2.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Add Company Data</span>
                </button>
              </DialogTrigger>
              <DialogContent className="w-[95%] max-w-[460px] border-neutral-200 bg-white p-6 font-sans rounded-2xl shadow-xl">
                <DialogHeader className="flex flex-col items-start text-left space-y-1.5 border-b border-neutral-100 pb-3">
                  <DialogTitle className="text-base font-bold text-neutral-900">Add Company Data</DialogTitle>
                  <DialogDescription className="text-xs text-neutral-500">
                    Enter target hiring company & recruiter contact details.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-3.5 py-3 text-xs font-medium">
                  {/* Row 1: Company Name & Target Email */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">Company Name *</label>
                      <input
                        required
                        placeholder="e.g. Stripe"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 p-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-black text-neutral-900 placeholder:text-neutral-400 h-9 transition-all"
                        value={newCompany.company_name}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, company_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">Target Email *</label>
                      <input
                        required
                        type="email"
                        placeholder="recruiter@stripe.com"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 p-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-black text-neutral-900 placeholder:text-neutral-400 h-9 transition-all"
                        value={newCompany.hr_email}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, hr_email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Row 2: Target Person Name & Target Role */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">Contact Name</label>
                      <input
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 p-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-black text-neutral-900 placeholder:text-neutral-400 h-9 transition-all"
                        value={newCompany.target_person_name || ""}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, target_person_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">Target Role</label>
                      <input
                        placeholder="e.g. Tech Lead / Recruiter"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 p-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-black text-neutral-900 placeholder:text-neutral-400 h-9 transition-all"
                        value={newCompany.target_person_role || ""}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, target_person_role: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Row 3: Website URL */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">Website URL (optional)</label>
                    <input
                      type="url"
                      placeholder="https://stripe.com"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 p-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-black text-neutral-900 placeholder:text-neutral-400 h-9 transition-all"
                      value={newCompany.website_url || ""}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, website_url: e.target.value })
                      }
                    />
                  </div>

                  {/* Row 4: Personalization Hook / Note */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">Personalization Hook / Note (optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Passionate about developer APIs and Stripe's recent SDK releases."
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 p-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-black text-neutral-900 placeholder:text-neutral-400 resize-none min-h-[55px] transition-all"
                      value={newCompany.personalization_hook || ""}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, personalization_hook: e.target.value })
                      }
                    />
                  </div>

                  <DialogFooter className="flex flex-row gap-2.5 justify-end border-t border-neutral-100 pt-3 mt-4">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                      onClick={() => setIsAdding(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {createMutation.isPending ? "Adding..." : "Add Company"}
                    </button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ─── MODE SWITCHER (PILL CAPSULE) ─── */}
        <div className="inline-flex items-center p-1 bg-white border border-neutral-200/90 rounded-xl shadow-3xs select-none">
          <button
            onClick={() => setMainMode("manual")}
            className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all cursor-pointer ${mainMode === "manual"
                ? "bg-[#141414] text-white shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
              }`}
          >
            Manual Outreach
          </button>
          <button
            onClick={() => setMainMode("csv")}
            className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all cursor-pointer ${mainMode === "csv"
                ? "bg-[#141414] text-white shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
              }`}
          >
            CSV Bulk Import
          </button>
        </div>

        {mainMode === "csv" ? (
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center">
            <dotlottie-wc
              src="https://lottie.host/675a6e97-8b37-4b95-925a-fe86629539f8/xtVl1jJ2z3.lottie"
              style={{ width: 'min(80vw, 320px)', height: 'min(80vw, 320px)' }}
              autoplay
              loop
            />
            <h3 className="mt-4 text-xl font-bold text-neutral-900">CSV Bulk Outreach</h3>
            <p className="mt-1 text-xs text-neutral-500 max-w-md leading-relaxed">
              We're polishing CSV import & campaign scheduling. Coming soon — streamlined bulk outreach to scale your recruiter campaigns.
            </p>
          </div>
        ) : (
          <>
            {/* ─── STATS ROW (ELEVATED SUMMARY CARDS) ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 select-none">
              {[
                { label: "Pending", count: counts.pending, badge: "bg-amber-50 text-amber-700 border-amber-200/70" },
                { label: "Approved", count: counts.approved, badge: "bg-emerald-50 text-emerald-700 border-emerald-200/70" },
                { label: "Sent", count: counts.sent, badge: "bg-blue-50 text-blue-700 border-blue-200/70" },
                { label: "Replied", count: counts.replied, badge: "bg-purple-50 text-purple-700 border-purple-200/70" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{s.label}</span>
                    <p className="font-mono text-2xl font-bold text-neutral-900 mt-0.5">{s.count}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${s.badge}`}>
                    {s.count}
                  </span>
                </div>
              ))}
            </div>

            {/* ─── TWO COLUMN PIPELINE & DETAIL WORKSPACE ─── */}
            <div className="grid gap-6 lg:grid-cols-12 items-start pt-1">
              {/* Left Column: Company Pipeline List */}
              {(!isMobile || !mobileDetailsOpen) && (
                <div className="lg:col-span-5 rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
                  {/* Pipeline Header */}
                  <div className="border-b border-neutral-100 px-5 py-3.5 bg-neutral-50/50 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                        Company Pipeline ({companies.length})
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approveAllMutation.mutate()}
                        disabled={counts.approved === 0 || approveAllMutation.isPending}
                        className="h-7 px-2.5 text-[11px] font-semibold rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer text-neutral-700"
                      >
                        <Check className="h-3 w-3 text-emerald-600" />
                        Approve All
                      </button>
                      <button
                        onClick={() => sendApprovedMutation.mutate()}
                        disabled={counts.approved === 0 || sendApprovedMutation.isPending}
                        className="h-7 px-2.5 text-[11px] font-semibold rounded-lg bg-[#2DC08D] hover:bg-[#25a77a] text-white disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Send className="h-3 w-3 text-white" />
                        Send Approved
                      </button>
                    </div>
                  </div>

                  {/* Company Items */}
                  <div className="divide-y divide-neutral-100 max-h-[580px] overflow-y-auto">
                    {companies.length === 0 ? (
                      <div className="p-12 text-center text-neutral-400">
                        <Building2 className="mx-auto mb-2.5 h-10 w-10 text-neutral-300" />
                        <p className="font-semibold text-neutral-800 text-sm">No company data found</p>
                        <p className="mt-1 text-xs text-neutral-400">
                          Add target company data manually to start your outreach campaign
                        </p>
                      </div>
                    ) : (
                      companies.map((company: Company) => {
                        const stepIdx = getCurrentStepIndex(company.status);
                        const isSelected = selected === company.id;
                        return (
                          <button
                            key={company.id}
                            onClick={() => {
                              setSelected(company.id);
                              if (isMobile) {
                                setMobileDetailsOpen(true);
                              }
                            }}
                            className={`w-full px-4 py-3.5 text-left transition-all border-l-[3px] flex flex-col gap-2 cursor-pointer ${isSelected
                                ? "bg-neutral-50/80 border-l-[#2DC08D]"
                                : "border-l-transparent hover:bg-neutral-50/40"
                              }`}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 font-mono text-xs font-bold text-neutral-700 shrink-0 border border-neutral-200/60">
                                {company.company_name.slice(0, 2).toUpperCase()}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-neutral-900 truncate">
                                    {company.company_name}
                                  </p>
                                  {company.website_url && (
                                    <ExternalLink className="h-3 w-3 text-neutral-400 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-neutral-500 truncate mt-0.5 font-medium">
                                  {company.role}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <StatusBadge status={company.status} />
                                <button
                                  type="button"
                                  className="p-1 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(company);
                                  }}
                                  title="Delete Lead"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pl-12 pr-1">
                              <div className="flex items-center gap-1">
                                {pipelineOrder.map((_, si) => (
                                  <div
                                    key={si}
                                    className={`h-1.5 w-3 rounded-full transition-colors ${si <= stepIdx ? "bg-[#2DC08D]" : "bg-neutral-200"
                                      }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-neutral-400 font-medium capitalize">
                                {company.status.replace("_", " ")}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Right Column: Selected Company Detail & AI Outreach Preview */}
              {(!isMobile || mobileDetailsOpen) && (
                <div className="lg:col-span-7 space-y-4">
                  {selectedCompany ? (
                    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
                      {isMobile && (
                        <button
                          type="button"
                          className="h-7 gap-1 text-xs font-semibold px-0 text-neutral-500 hover:text-neutral-900 flex items-center cursor-pointer mb-2"
                          onClick={() => setMobileDetailsOpen(false)}
                        >
                          <ChevronLeft className="h-4 w-4" /> Back to list
                        </button>
                      )}

                      {/* Target Info Header */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between border-b border-neutral-100 pb-4">
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
                            {selectedCompany.company_name}
                          </h3>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500 font-normal">
                            <span>{selectedCompany.role}</span>
                            {(selectedCompany.createdAt || selectedCompany.created_at) && (
                              <>
                                <span>•</span>
                                <span className="text-[11px] text-neutral-400">
                                  Added {new Date(selectedCompany.createdAt || selectedCompany.created_at!).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {selectedCompany.website_url && (
                          <a
                            href={selectedCompany.website_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-black font-medium border border-neutral-200 px-2.5 py-1 rounded-lg self-start transition-colors"
                          >
                            <span>Website</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      {/* Contact Details Grid */}
                      <div className="grid grid-cols-2 gap-3 bg-neutral-50/60 border border-neutral-100 rounded-xl p-3.5">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                            <User className="h-3 w-3" /> Target Contact
                          </p>
                          <p className="text-xs font-semibold text-neutral-900">
                            {selectedCompany.target_person_name || "Hiring Team"}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            {selectedCompany.target_person_role || "Recruiter"}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Recipient Email
                          </p>
                          <p className="text-xs font-semibold text-neutral-900 truncate">
                            {selectedCompany.hr_email}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            Direct Outreach
                          </p>
                        </div>
                      </div>

                      {/* Personalization Hook Card */}
                      <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                            Personalization Hook
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-emerald-950 font-medium">
                          {selectedCompany.personalization_hook || "Waiting for generation..."}
                        </p>
                      </div>

                      {selectedCompany.error_message && (
                        <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-4">
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
                            Generation Error
                          </p>
                          <p className="text-xs leading-relaxed text-red-900 break-words">
                            {selectedCompany.error_message}
                          </p>
                        </div>
                      )}

                      {/* AI Draft Content */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            AI Outreach Draft
                          </span>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-medium text-neutral-500 flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={showFollowUps}
                                onChange={(e) => setShowFollowUps(e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                              />
                              <span>Follow-up Sequence</span>
                            </label>
                          </div>
                        </div>

                        {(() => {
                          let variantsData: any = null;
                          try {
                            if (selectedCompany.generated_variants_json) {
                              variantsData = JSON.parse(selectedCompany.generated_variants_json);
                            }
                          } catch (e) {
                            console.error("Variants parse error:", e);
                          }

                          const handleCopyText = (txt: string) => {
                            navigator.clipboard.writeText(txt);
                            toast.success("Copied to clipboard!");
                          };

                          return (
                            <div className="space-y-4">
                              {/* Subject & Body Container */}
                              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/40 overflow-hidden">
                                <div className="border-b border-neutral-200/80 px-4 py-2.5 bg-neutral-100/50 flex items-center justify-between">
                                  <div className="flex-1 min-w-0 pr-3">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                                      Subject
                                    </span>
                                    <p className="text-xs font-semibold text-neutral-900 truncate">
                                      {selectedCompany.generated_subject || "No subject generated yet."}
                                    </p>
                                  </div>
                                  {selectedCompany.generated_subject && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(selectedCompany.generated_subject || "");
                                        toast.success("Subject copied!");
                                      }}
                                      className="text-[11px] font-medium text-neutral-500 hover:text-black transition-colors shrink-0 cursor-pointer"
                                    >
                                      Copy Subject
                                    </button>
                                  )}
                                </div>
                                <div className="p-4">
                                  <div className="font-sans text-xs sm:text-[13px] leading-relaxed text-neutral-800 whitespace-pre-wrap select-text">
                                    {selectedCompany.generated_mail
                                      ? cleanDraft(selectedCompany.generated_mail, selectedCompany)
                                      : "Click Auto-Generate Mail below to conduct AI research and generate tailored outreach."}
                                  </div>
                                </div>
                              </div>

                              {/* Follow up sequence items */}
                              {showFollowUps && variantsData?.followups && (
                                <div className="space-y-3 animate-slide-up border-t border-neutral-100 pt-4">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                    Follow-up Sequence
                                  </span>

                                  {/* Day 4 */}
                                  <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 space-y-2 shadow-3xs">
                                    <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                                      <span className="text-xs font-semibold text-neutral-800">Follow-up 1 (Day 4)</span>
                                      <button
                                        type="button"
                                        className="text-[11px] font-medium text-neutral-500 hover:text-black transition-colors cursor-pointer"
                                        onClick={() => handleCopyText(
                                          `Subject: ${variantsData.followups.day4.subject_options?.[0] || 'Followup 4'}\n\n${variantsData.followups.day4.body}`
                                        )}
                                      >
                                        Copy All
                                      </button>
                                    </div>
                                    <p className="text-[11px] font-semibold text-neutral-500 truncate">
                                      Re: {variantsData.followups.day4.subject_options?.[0]}
                                    </p>
                                    <p className="text-xs text-neutral-700 font-sans whitespace-pre-wrap leading-relaxed">
                                      {cleanDraft(variantsData.followups.day4.body, selectedCompany)}
                                    </p>
                                  </div>

                                  {/* Day 7 */}
                                  <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 space-y-2 shadow-3xs">
                                    <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                                      <span className="text-xs font-semibold text-neutral-800">Follow-up 2 (Day 7)</span>
                                      <button
                                        type="button"
                                        className="text-[11px] font-medium text-neutral-500 hover:text-black transition-colors cursor-pointer"
                                        onClick={() => handleCopyText(
                                          `Subject: ${variantsData.followups.day7.subject_options?.[0] || 'Followup 7'}\n\n${variantsData.followups.day7.body}`
                                        )}
                                      >
                                        Copy All
                                      </button>
                                    </div>
                                    <p className="text-[11px] font-semibold text-neutral-500 truncate">
                                      Re: {variantsData.followups.day7.subject_options?.[0]}
                                    </p>
                                    <p className="text-xs text-neutral-700 font-sans whitespace-pre-wrap leading-relaxed">
                                      {cleanDraft(variantsData.followups.day7.body, selectedCompany)}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Action Buttons Bar */}
                      <div className="pt-2">
                        {selectedCompany.status === "mail_generated" ? (
                          <div className="flex w-full items-center gap-2">
                            <button
                              type="button"
                              className="flex-1 h-10 gap-2 border-none bg-[#2DC08D] hover:bg-[#25a77a] text-white rounded-xl font-medium text-xs cursor-pointer transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
                              disabled={approveSingleMutation.isPending}
                              onClick={() => approveSingleMutation.mutate(selectedCompany.id)}
                            >
                              <Check className="h-4 w-4 text-white shrink-0" />
                              <span>Approve Email</span>
                            </button>

                            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                              <DialogTrigger asChild>
                                <button
                                  type="button"
                                  className="h-10 px-3.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer shadow-3xs"
                                  title="Edit Mail & Details"
                                  onClick={() => {
                                    setEditData({
                                      company_name: selectedCompany.company_name,
                                      generated_subject: selectedCompany.generated_subject || "",
                                      generated_mail: cleanDraft(selectedCompany.generated_mail || "", selectedCompany),
                                      personalization_hook: selectedCompany.personalization_hook || "",
                                    });
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] sm:max-w-[650px] rounded-2xl bg-white border-neutral-200 p-6 shadow-xl">
                                <DialogHeader>
                                  <DialogTitle className="text-base font-bold text-neutral-900">Edit Mail & Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Company Name</Label>
                                    <Input
                                      className="rounded-xl border-neutral-200"
                                      value={editData.company_name || ""}
                                      onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Generated Subject</Label>
                                    <Input
                                      className="rounded-xl border-neutral-200"
                                      value={editData.generated_subject || ""}
                                      onChange={(e) => setEditData({ ...editData, generated_subject: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Generated Email Body</Label>
                                    <Textarea
                                      className="min-h-[260px] font-sans text-xs sm:text-sm leading-relaxed rounded-xl border-neutral-200"
                                      value={editData.generated_mail || ""}
                                      onChange={(e) => setEditData({ ...editData, generated_mail: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Personalization Hook</Label>
                                    <Input
                                      className="rounded-xl border-neutral-200"
                                      value={editData.personalization_hook || ""}
                                      onChange={(e) => setEditData({ ...editData, personalization_hook: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <DialogFooter className="flex-col gap-2 sm:flex-row">
                                  <button
                                    type="button"
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                                    onClick={() => setIsEditing(false)}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                                    onClick={() => {
                                      updateMutation.mutate({ id: selectedCompany.id, data: editData });
                                      setIsEditing(false);
                                    }}
                                    disabled={updateMutation.isPending}
                                  >
                                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                  </button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <button
                              type="button"
                              className="h-10 px-3.5 rounded-xl border border-neutral-200 bg-white hover:bg-red-50 hover:text-red-600 text-neutral-500 transition-colors cursor-pointer shadow-3xs"
                              title="Delete Lead"
                              onClick={() => {
                                setDeleteTarget(selectedCompany);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : ["approved", "mail_sent", "replied"].includes(selectedCompany.status) ? (
                          <div className="flex w-full items-center gap-2">
                            <button
                              type="button"
                              className="flex-1 h-10 gap-2 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900 rounded-xl font-medium text-xs shadow-xs cursor-pointer flex items-center justify-center transition-colors"
                              title="Open direct compose window in Gmail web app"
                              onClick={() => {
                                const mailBody = cleanDraft(selectedCompany.generated_mail || "", selectedCompany);
                                if (isMobile) {
                                  const mailtoUrl = `mailto:${encodeURIComponent(selectedCompany.hr_email)}?subject=${encodeURIComponent(selectedCompany.generated_subject || "")}&body=${encodeURIComponent(mailBody)}`;
                                  window.location.href = mailtoUrl;
                                } else {
                                  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedCompany.hr_email)}&su=${encodeURIComponent(selectedCompany.generated_subject || "")}&body=${encodeURIComponent(mailBody)}`;
                                  window.open(url, "_blank");
                                }
                                updateMutation.mutate({ id: selectedCompany.id, data: { status: "mail_sent" } });
                              }}
                            >
                              <GmailIcon />
                              <span>Draft in Gmail</span>
                            </button>

                            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                              <DialogTrigger asChild>
                                <button
                                  type="button"
                                  className="h-10 px-3.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer shadow-3xs"
                                  title="Edit Mail & Details"
                                  onClick={() => {
                                    setEditData({
                                      company_name: selectedCompany.company_name,
                                      generated_subject: selectedCompany.generated_subject || "",
                                      generated_mail: cleanDraft(selectedCompany.generated_mail || "", selectedCompany),
                                      personalization_hook: selectedCompany.personalization_hook || "",
                                    });
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] sm:max-w-[650px] rounded-2xl bg-white border-neutral-200 p-6 shadow-xl">
                                <DialogHeader>
                                  <DialogTitle className="text-base font-bold text-neutral-900">Edit Mail & Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Company Name</Label>
                                    <Input
                                      className="rounded-xl border-neutral-200"
                                      value={editData.company_name || ""}
                                      onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Generated Subject</Label>
                                    <Input
                                      className="rounded-xl border-neutral-200"
                                      value={editData.generated_subject || ""}
                                      onChange={(e) => setEditData({ ...editData, generated_subject: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Generated Email Body</Label>
                                    <Textarea
                                      className="min-h-[260px] font-sans text-xs sm:text-sm leading-relaxed rounded-xl border-neutral-200"
                                      value={editData.generated_mail || ""}
                                      onChange={(e) => setEditData({ ...editData, generated_mail: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Personalization Hook</Label>
                                    <Input
                                      className="rounded-xl border-neutral-200"
                                      value={editData.personalization_hook || ""}
                                      onChange={(e) => setEditData({ ...editData, personalization_hook: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <DialogFooter className="flex-col gap-2 sm:flex-row">
                                  <button
                                    type="button"
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                                    onClick={() => setIsEditing(false)}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                                    onClick={() => {
                                      updateMutation.mutate({ id: selectedCompany.id, data: editData });
                                      setIsEditing(false);
                                    }}
                                    disabled={updateMutation.isPending}
                                  >
                                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                  </button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <button
                              type="button"
                              className="h-10 px-3.5 rounded-xl border border-neutral-200 bg-white hover:bg-red-50 hover:text-red-600 text-neutral-500 transition-colors cursor-pointer shadow-3xs"
                              title="Delete Lead"
                              onClick={() => {
                                setDeleteTarget(selectedCompany);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex w-full items-center gap-2">
                            <button
                              type="button"
                              className="flex-1 h-10 gap-2 bg-[#111111] hover:bg-black text-white rounded-xl font-medium text-xs cursor-pointer transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
                              disabled={loadingId === selectedCompany.id}
                              onClick={() => {
                                handleGenerateCheck(() => {
                                  setLoadingId(selectedCompany.id);
                                  setGenerationStep("🔍 Researching Company Profile...");

                                  const steps = [
                                    "🌐 Crawling Website & Tech Stack...",
                                    "📰 Scanning Social Media & News...",
                                    "🧠 Personalizing AI Cover Letter...",
                                    "✨ Refining Cover Letter Drafts..."
                                  ];
                                  let stepIdx = 0;
                                  const interval = setInterval(() => {
                                    if (stepIdx < steps.length) {
                                      setGenerationStep(steps[stepIdx]);
                                      stepIdx++;
                                    }
                                  }, 2200);

                                  const runGenerate = () => {
                                    api.coldmail.generate(selectedCompany.id, "gemini", "gemini-2.5-flash")
                                      .then(() => {
                                        queryClient.invalidateQueries({ queryKey: ["coldmail"] });
                                        toast.success("Mail generated successfully");
                                        clearInterval(interval);
                                        setLoadingId(null);
                                        setGenerationStep("");
                                      })
                                      .catch((e) => {
                                        const errStr = String(e);
                                        if (errStr.includes("Gemini") || errStr.includes("GoogleGenerativeAI") || errStr.includes("evaluations failed") || errStr.includes("rate limit") || errStr.includes("404")) {
                                          setShowAiErrorModal(true);
                                        } else {
                                          toast.error(errStr);
                                        }
                                        queryClient.invalidateQueries({ queryKey: ["coldmail"] });
                                        clearInterval(interval);
                                        setLoadingId(null);
                                        setGenerationStep("");
                                      });
                                  };

                                  api.coldmail.scrape(selectedCompany.id)
                                    .then(() => runGenerate())
                                    .catch(() => runGenerate());
                                });
                              }}
                            >
                              {loadingId === selectedCompany.id ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin shrink-0 text-white" />
                                  <span className="text-xs font-semibold text-white truncate">
                                    {isMobile && generationStep
                                      ? `${generationStep.split(" ")[0]} ${generationStep.split(" ")[1].slice(0, 11)}...`
                                      : generationStep}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 text-[#2DC08D] shrink-0" />
                                  <span className="font-semibold text-xs text-white">
                                    {isMobile ? "Generate Mail" : "Auto-Generate Mail"}
                                  </span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              className="h-10 px-3.5 rounded-xl border border-neutral-200 bg-white hover:bg-red-50 hover:text-red-600 text-neutral-500 transition-colors cursor-pointer shadow-3xs"
                              title="Delete Lead"
                              onClick={() => {
                                setDeleteTarget(selectedCompany);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              className="h-10 px-3.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors cursor-pointer shadow-3xs"
                              title="Skip Lead"
                              onClick={() => {
                                api.coldmail.skip(selectedCompany.id).then(() =>
                                  queryClient.invalidateQueries({ queryKey: ["coldmail"] })
                                );
                              }}
                            >
                              <SkipForward className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Sender Profile Details */}
                      <div className="pt-4 border-t border-neutral-100 mt-2">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Sender Profile Context
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Location
                            </p>
                            <p className="font-medium text-neutral-800">{selectedCompany.sender_location || "Not specified"}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                              <User className="h-3 w-3" /> Sender Name
                            </p>
                            <p className="font-medium text-neutral-800">{selectedCompany.sender_name || "Outly User"}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                              <Wrench className="h-3 w-3" /> Key Skills
                            </p>
                            <p className="font-medium text-neutral-800 truncate">{selectedCompany.key_skills || "General"}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" /> Experience
                            </p>
                            <p className="font-medium text-neutral-800 truncate">{selectedCompany.experience_level || "Not specified"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[480px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/70 text-sm text-neutral-400 shadow-3xs">
                      <div className="text-center p-6">
                        <div className="relative mx-auto mb-3 inline-flex p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60">
                          <Mail className="h-8 w-8 text-neutral-400" />
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white flex items-center justify-center border border-neutral-200 shadow-xs">
                            <Eye className="h-3 w-3 text-[#2DC08D]" />
                          </div>
                        </div>
                        <p className="font-bold text-neutral-800 text-sm">Select a company</p>
                        <p className="mt-1 text-xs text-neutral-400 max-w-[220px] leading-relaxed">
                          Choose a target lead from your pipeline to preview, generate, and edit personalized outreach.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <AlertDialog open={showSettingsPrompt} onOpenChange={setShowSettingsPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Profile Settings Required</AlertDialogTitle>
            <AlertDialogDescription>
              Please complete your profile details (Full Name, Tech Stack, Experience) in Settings before generating emails so AI can write personalized emails with your information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/settings")}>
              Go to Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AiErrorModal open={showAiErrorModal} onClose={() => setShowAiErrorModal(false)} />
    </>
  );
}
