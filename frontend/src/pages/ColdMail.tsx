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
import LockedFeatureGuard from "@/components/LockedFeatureGuard";
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
  const [selected, setSelected] = useState<number | null>(null);
  const [mainMode, setMainMode] = useState<"manual" | "csv">("manual");
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<"formal" | "casual" | "short">("formal");
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [companySize, setCompanySize] = useState<"startup" | "mid" | "large">("startup");
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    company_name: "",
    website_url: "",
    hr_email: "",
    role: "Software Development Engineer",
    target_person_name: "",
    target_person_role: "",
    key_skills: "React, TypeScript, Node.js",
    experience_level: "3rd year CS student",
    sender_name: "",
    sender_location: "",
    personalization_hook: "",
  });
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<string>("gemini");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [generationStep, setGenerationStep] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Company>>({});
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [showSettingsPrompt, setShowSettingsPrompt] = useState(false);
  const [showAiErrorModal, setShowAiErrorModal] = useState(false);
  
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

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
      experience_level: settings.education || current.experience_level || "3rd year CS student",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coldmail"] });
      setIsAdding(false);
      setNewCompany({
        company_name: "",
        website_url: "",
        hr_email: "",
        role: "Software Development Engineer",
        target_person_name: "",
        target_person_role: "",
        key_skills: settings?.skills || "React, TypeScript, Node.js",
        experience_level: settings?.education || "3rd year CS student",
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

  const sendApprovedMutation = useMutation({
    mutationFn: () => api.coldmail.sendApproved(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coldmail"] });
      toast.success(`Queued ${data.queued} mails`);
    },
    onError: (e) => toast.error(String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.coldmail.delete(id),
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
    mutationFn: ({ id, data }: { id: number; data: Partial<Company> }) =>
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

  // Helper to ensure MSU reference in draft
  // Remove repeated lines/paragraphs and ensure MSU reference
  function cleanDraft(draft: string): string {
    // Remove repeated paragraphs (split by double newlines)
    const seen = new Set<string>();
    const uniqueParas = draft
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => {
        if (!p || seen.has(p)) return false;
        seen.add(p);
        return true;
      });
    return uniqueParas.join("\n\n");
  }

  return (
    <>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove ${deleteTarget.company_name} from your cold mail pipeline.`
                : "This will permanently remove this lead from your cold mail pipeline."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LockedFeatureGuard featureTitle="Cold Mail Automation Engine">
        <div className="mx-auto w-full max-w-7xl px-6 py-6 sm:px-8 space-y-8 animate-fade-in pb-16">
        
        {/* Hero text header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 text-left">
            <span className="text-xs font-extrabold tracking-[0.2em] text-outly-accent uppercase bg-outly-accent/5 px-3 py-1.5 rounded-full inline-block">
              COLD MAIL MANAGER
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
              Smart Cold Outreach & Follow-up Manager
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
              Generate personalized cold emails for target hiring managers, manage drafts, and track application responses in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-border shadow-sm rounded-full px-5 py-2.5 font-semibold text-sm h-11">
                  <Plus className="h-4 w-4 text-outly-accent" />
                  Add Company Data
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95%] max-w-[420px] border-border bg-card p-5 font-sans rounded-2xl">
                <DialogHeader className="flex flex-col items-start text-left space-y-1.5 border-b border-border/40 pb-3">
                  <DialogTitle className="text-base font-bold text-foreground">Add Company Data</DialogTitle>
                  <DialogDescription className="text-[11px] text-muted-foreground leading-none">
                    Enter target company & contact details.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-3.5 py-3 text-xs font-semibold">
                  {/* Row 1: Company Name & Target Email */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Company Name *</label>
                      <input
                        required
                        placeholder="e.g. OpenAI"
                        className="w-full rounded-lg border border-border bg-white p-2 text-xs outline-none focus:ring-1 focus:ring-outly-accent text-foreground shadow-xs placeholder:text-muted-foreground/60 h-9"
                        value={newCompany.company_name}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, company_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Target Email *</label>
                      <input
                        required
                        type="email"
                        placeholder="sam@openai.com"
                        className="w-full rounded-lg border border-border bg-white p-2 text-xs outline-none focus:ring-1 focus:ring-outly-accent text-foreground shadow-xs placeholder:text-muted-foreground/60 h-9"
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
                      <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Contact Name</label>
                      <input
                        placeholder="e.g. Sam Altman"
                        className="w-full rounded-lg border border-border bg-white p-2 text-xs outline-none focus:ring-1 focus:ring-outly-accent text-foreground shadow-xs placeholder:text-muted-foreground/60 h-9"
                        value={newCompany.target_person_name || ""}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, target_person_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Target Role</label>
                      <input
                        placeholder="e.g. CEO"
                        className="w-full rounded-lg border border-border bg-white p-2 text-xs outline-none focus:ring-1 focus:ring-outly-accent text-foreground shadow-xs placeholder:text-muted-foreground/60 h-9"
                        value={newCompany.target_person_role || ""}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, target_person_role: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Row 3: Website URL */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Website URL (optional)</label>
                    <input
                      type="url"
                      placeholder="https://openai.com"
                      className="w-full rounded-lg border border-border bg-white p-2 text-xs outline-none focus:ring-1 focus:ring-outly-accent text-foreground shadow-xs placeholder:text-muted-foreground/60 h-9"
                      value={newCompany.website_url || ""}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, website_url: e.target.value })
                      }
                    />
                  </div>

                  {/* Row 4: Personalization Hook / Note */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Personalization Hook / Note (optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Impressed by OpenAI's commitment to developer tooling."
                      className="w-full rounded-lg border border-border bg-white p-2 text-xs outline-none focus:ring-1 focus:ring-outly-accent text-foreground shadow-xs placeholder:text-muted-foreground/60 resize-none min-h-[50px]"
                      value={newCompany.personalization_hook || ""}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, personalization_hook: e.target.value })
                      }
                    />
                  </div>

                  <DialogFooter className="flex flex-row gap-2.5 justify-end border-t border-border/40 pt-3 mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 sm:flex-none border-border text-xs font-semibold h-9 rounded-full hover:bg-secondary active:scale-[0.98] transition"
                      onClick={() => setIsAdding(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-1 sm:flex-none bg-outly-accent hover:bg-outly-accent/90 text-white text-xs font-semibold h-9 rounded-full shadow-xs active:scale-[0.98] transition-all"
                    >
                      {createMutation.isPending ? "Adding..." : "Add Company"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>


          </div>
        </div>

        {/* Mode Switcher Navigation */}
        <div className="flex border-b border-border gap-2">
          <button
            onClick={() => setMainMode("manual")}
            className={`pb-3.5 px-4 text-sm font-semibold transition-all relative ${
              mainMode === "manual"
                ? "text-outly-accent border-b-2 border-outly-accent font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Manual Outreach
          </button>
          <button
            onClick={() => setMainMode("csv")}
            className={`pb-3.5 px-4 text-sm font-semibold transition-all flex items-center gap-2 relative ${
              mainMode === "csv"
                ? "text-outly-accent border-b-2 border-outly-accent font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>CSV Bulk Import</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Coming Soon
            </span>
          </button>
        </div>

        {mainMode === "csv" ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-4 border border-amber-500/20">
              <Upload className="h-8 w-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-semibold mb-3 border border-amber-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Feature In Development</span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">CSV Bulk Outreach (Coming Soon)</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
              Automated CSV bulk import and multi-company campaign scheduling is coming soon. Use Manual Outreach to manage and personalize your leads.
            </p>
            <Button disabled variant="outline" className="gap-2 cursor-not-allowed opacity-60 rounded-full">
              <Upload className="h-4 w-4" /> Upload CSV (Locked)
            </Button>
          </div>
        ) : (
          <>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pending", count: counts.pending, color: "text-warning bg-warning/10 border-warning/20" },
          { label: "Approved", count: counts.approved, color: "text-outly-accent bg-outly-accent/10 border-outly-accent/20" },
          { label: "Sent", count: counts.sent, color: "text-success bg-success/10 border-success/20" },
          { label: "Replied", count: counts.replied, color: "text-info bg-info/10 border-info/20" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4 shadow-sm"
          >
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</span>
            <span className={`font-mono text-xl font-bold px-3 py-1 rounded-xl border ${s.color}`}>
              {s.count}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {(!isMobile || !mobileDetailsOpen) && (
          <div className="lg:col-span-3 rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border px-6 py-4 bg-slate-50/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/70">Company Pipeline</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-semibold rounded-full"
                  onClick={() => approveAllMutation.mutate()}
                  disabled={counts.approved === 0 || approveAllMutation.isPending}
                >
                  <Check className="h-3.5 w-3.5 text-green-600" /> Approve All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-semibold text-outly-accent border-outly-accent/30 bg-outly-accent/5 hover:bg-outly-accent/10 rounded-full"
                  onClick={() => sendApprovedMutation.mutate()}
                  disabled={
                    counts.approved === 0 || sendApprovedMutation.isPending
                  }
                >
                  <Send className="h-3.5 w-3.5" /> Send Approved
                </Button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border max-h-[520px] overflow-auto custom-scrollbar flex-1">
            {companies.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground">
                <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="font-semibold text-foreground text-base">No company data found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add target company data manually to start your outreach campaign
                </p>
              </div>
            ) : (
              companies.map((company: Company) => {
                const stepIdx = getCurrentStepIndex(company.status);
                return (
                  <button
                    key={company.id}
                    onClick={() => {
                      setSelected(company.id);
                      if (isMobile) {
                        setMobileDetailsOpen(true);
                      }
                    }}
                    className={`w-full px-5 py-4 text-left transition-all hover:bg-slate-50 border-l-4 ${
                      selected === company.id
                        ? "bg-outly-accent/5 border-l-outly-accent"
                        : "border-l-transparent"
                    }`}
                  >
                    {/* Top Row: Avatar, Info, Status, Delete */}
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-700 shrink-0 overflow-hidden border border-slate-200">
                        {company.company_name.slice(0, 2).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-foreground truncate">
                            {company.company_name}
                          </p>
                          {company.website_url && (
                             <ExternalLink className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                          {company.role}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={company.status} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(company);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Bottom Row: Pipeline indicators */}
                    <div className="mt-3 flex items-center justify-between pl-13 pr-2">
                      <div className="flex items-center gap-1">
                        {pipelineOrder.map((_, si) => (
                          <div
                            key={si}
                            className={`h-1.5 w-3 rounded-full ${si <= stepIdx ? "bg-outly-accent" : "bg-slate-200"}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold capitalize">
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

        {(!isMobile || mobileDetailsOpen) && (
          <div className="lg:col-span-2 space-y-4">
            {selectedCompany ? (
              <div className="space-y-6 rounded-2xl border border-border bg-white p-6 animate-slide-in shadow-sm">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-semibold px-0 text-muted-foreground hover:text-foreground flex self-start"
                    onClick={() => setMobileDetailsOpen(false)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Back to list
                  </Button>
                )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedCompany.company_name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {(selectedCompany.createdAt || selectedCompany.created_at) && (
                      <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                        Since {new Date(selectedCompany.createdAt || selectedCompany.created_at!).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {selectedCompany.website_url && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={selectedCompany.website_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-border py-4">
                <div className="space-y-1">
                   <p className="text-[10px] font-bold uppercase text-muted-foreground/60 flex items-center gap-1">
                    <User className="h-3 w-3" /> Target
                   </p>
                   <p className="text-xs font-medium">
                     {selectedCompany.target_person_name || "Hiring Team"}
                   </p>
                   <p className="text-[10px] text-muted-foreground truncate">
                     {selectedCompany.target_person_role || "Recruiter"}
                   </p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-bold uppercase text-muted-foreground/60 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                   </p>
                   <p className="text-xs font-medium truncate">
                     {selectedCompany.hr_email}
                   </p>
                   <p className="text-[10px] text-muted-foreground">
                     Direct Outreach
                   </p>
                </div>
              </div>


              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                  🎯 Personalization Hook
                </p>
                <p className="text-sm text-primary leading-relaxed font-medium">
                  {selectedCompany.personalization_hook || "Waiting for generation..."}
                </p>
              </div>

              {selectedCompany.error_message && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-destructive/80">
                    Generation Error
                  </p>
                  <p className="text-xs leading-relaxed text-destructive/90 break-words">
                    {selectedCompany.error_message}
                  </p>
                </div>
              )}

              {/* AI Draft & Variants */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground/60 block">
                      AI Draft Content
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">Follow-up Sequence</span>
                      <input
                        type="checkbox"
                        checked={showFollowUps}
                        onChange={(e) => setShowFollowUps(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
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

                    const activeDraftBody = variantsData?.variants?.[activeTab]?.body || selectedCompany.generated_mail;
                    const activeSubjectOptions = variantsData?.variants?.[activeTab]?.subject_options || [
                      selectedCompany.generated_subject || "Subject will appear here"
                    ];

                    const handleCopyText = (txt: string) => {
                      navigator.clipboard.writeText(txt);
                      toast.success("Copied to clipboard!");
                    };

                    const handleApplySubject = (subj: string) => {
                      updateMutation.mutate({
                        id: selectedCompany.id,
                        data: { generated_subject: subj }
                      });
                    };

                    const handleApplyBody = (body: string) => {
                      updateMutation.mutate({
                        id: selectedCompany.id,
                        data: { generated_mail: body }
                      });
                    };

                    return (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                          <div className="border-b border-border/60 pb-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1">
                              Subject
                            </span>
                            <p className="text-xs font-semibold text-foreground">
                              {selectedCompany.generated_subject || "No subject generated yet."}
                            </p>
                          </div>

                          {/* Email Body */}
                          <div className="font-mono text-[11px] leading-relaxed text-secondary-foreground whitespace-pre-wrap pt-1">
                            {selectedCompany.generated_mail ? cleanDraft(selectedCompany.generated_mail) : "No draft generated yet."}
                          </div>
                        </div>

                        {/* Follow up sequence items */}
                        {showFollowUps && variantsData?.followups && (
                          <div className="space-y-3 animate-slide-up border-t border-border/60 pt-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block">
                              ⏰ Follow-up Sequence
                            </span>

                            {/* Day 4 */}
                            <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
                              <div className="flex justify-between items-center border-b border-border/40 pb-1.5">
                                <span className="text-[11px] font-semibold text-foreground">Follow-up 1 (Day 4)</span>
                                <Button
                                  size="sm"
                                  type="button"
                                  variant="ghost"
                                  className="h-6 px-2 text-[10px] text-muted-foreground"
                                  onClick={() => handleCopyText(
                                    `Subject: ${variantsData.followups.day4.subject_options?.[0] || 'Followup 4'}\n\n${variantsData.followups.day4.body}`
                                  )}
                                >
                                  Copy All
                                </Button>
                              </div>
                              <p className="text-[11px] font-semibold text-muted-foreground truncate">
                                Re: {variantsData.followups.day4.subject_options?.[0]}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                                {variantsData.followups.day4.body}
                              </p>
                            </div>

                            {/* Day 7 */}
                            <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
                              <div className="flex justify-between items-center border-b border-border/40 pb-1.5">
                                <span className="text-[11px] font-semibold text-foreground">Follow-up 2 (Day 7)</span>
                                <Button
                                  size="sm"
                                  type="button"
                                  variant="ghost"
                                  className="h-6 px-2 text-[10px] text-muted-foreground"
                                  onClick={() => handleCopyText(
                                    `Subject: ${variantsData.followups.day7.subject_options?.[0] || 'Followup 7'}\n\n${variantsData.followups.day7.body}`
                                  )}
                                >
                                  Copy All
                                </Button>
                              </div>
                              <p className="text-[11px] font-semibold text-muted-foreground truncate">
                                Re: {variantsData.followups.day7.subject_options?.[0]}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                                {variantsData.followups.day7.body}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {["mail_generated", "approved"].includes(selectedCompany.status) ? (
                    <div className="flex w-full items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2.5 h-10 border-border bg-card hover:bg-secondary/40 text-foreground font-semibold shadow-sm cursor-pointer"
                        title="Open direct compose window in Gmail web app"
                        onClick={() => {
                          if (isMobile) {
                            const mailtoUrl = `mailto:${encodeURIComponent(selectedCompany.hr_email)}?subject=${encodeURIComponent(selectedCompany.generated_subject || "")}&body=${encodeURIComponent(selectedCompany.generated_mail || "")}`;
                            window.location.href = mailtoUrl;
                          } else {
                            const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedCompany.hr_email)}&su=${encodeURIComponent(selectedCompany.generated_subject || "")}&body=${encodeURIComponent(selectedCompany.generated_mail || "")}`;
                            window.open(url, "_blank");
                          }
                        }}
                      >
                        <GmailIcon />
                        <span>Draft in Gmail</span>
                      </Button>

                      <Dialog open={isEditing} onOpenChange={setIsEditing}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-10 px-3 cursor-pointer"
                            title="Edit Mail & Details"
                            onClick={() => {
                              setEditData({
                                company_name: selectedCompany.company_name,
                                generated_subject: selectedCompany.generated_subject || "",
                                generated_mail: selectedCompany.generated_mail || "",
                                personalization_hook: selectedCompany.personalization_hook || "",
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] sm:max-w-[700px]">
                          <DialogHeader>
                            <DialogTitle>Edit Mail & Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-2">
                            <div className="space-y-2">
                              <Label>Company Name</Label>
                              <Input
                                value={editData.company_name || ""}
                                onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Generated Subject</Label>
                              <Input
                                value={editData.generated_subject || ""}
                                onChange={(e) => setEditData({ ...editData, generated_subject: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Generated Email Body</Label>
                              <Textarea
                                className="min-h-[300px] font-mono text-[13px]"
                                value={editData.generated_mail || ""}
                                onChange={(e) => setEditData({ ...editData, generated_mail: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Personalization Hook (Preview)</Label>
                              <Input
                                value={editData.personalization_hook || ""}
                                onChange={(e) => setEditData({ ...editData, personalization_hook: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter className="flex-col gap-2 sm:flex-row">
                            <Button
                              onClick={() => {
                                updateMutation.mutate({ id: selectedCompany.id, data: editData });
                                setIsEditing(false);
                              }}
                              disabled={updateMutation.isPending}
                            >
                              {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 px-3 hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                        title="Delete Lead"
                        onClick={() => {
                          setDeleteTarget(selectedCompany);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex w-full items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-2 h-10 border-none bg-outly-accent hover:bg-outly-accent/95 text-white rounded-full font-semibold cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg shadow-outly-accent/15"
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

                            api.coldmail.scrape(selectedCompany.id).then(() => {
                              api.coldmail.generate(selectedCompany.id, "gemini", "gemini-2.5-flash").then(() => {
                                queryClient.invalidateQueries({ queryKey: ["coldmail"] });
                                toast.success("Mail generated successfully");
                                clearInterval(interval);
                                setLoadingId(null);
                                setGenerationStep("");
                              }).catch((e) => {
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
                            }).catch((e) => {
                              toast.error(String(e));
                              clearInterval(interval);
                              setLoadingId(null);
                              setGenerationStep("");
                            });
                          });
                        }}
                      >
                        {loadingId === selectedCompany.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin shrink-0 text-white" />
                            <span className="animate-fade-in text-[10px] font-bold text-white tracking-wide truncate">
                              {isMobile && generationStep
                                ? `${generationStep.split(" ")[0]} ${generationStep.split(" ")[1].slice(0, 11)}...`
                                : generationStep}
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 text-white animate-bounce shrink-0" />
                            <span className="font-bold text-xs tracking-wide">
                              {isMobile ? "Generate" : "Auto-Generate Mail"}
                            </span>
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 px-3 hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                        title="Delete Lead"
                        onClick={() => {
                          setDeleteTarget(selectedCompany);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 px-3 cursor-pointer"
                        title="Skip Lead"
                        onClick={() => {
                          api.coldmail.skip(selectedCompany.id).then(() =>
                            queryClient.invalidateQueries({ queryKey: ["coldmail"] })
                          );
                        }}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

              {/* Advanced info section */}
              <div className="pt-4 border-t border-border mt-4">
                 <button className="flex items-center justify-between w-full group">
                   <p className="text-[10px] font-bold uppercase text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                     Sender Profile Details
                   </p>
                   <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                 </button>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" /> From
                      </p>
                      <p className="text-[10px] font-medium">{selectedCompany.sender_location}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <User className="h-2.5 w-2.5" /> Identity
                      </p>
                      <p className="text-[10px] font-medium">{selectedCompany.sender_name}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <Wrench className="h-2.5 w-2.5" /> Skills
                      </p>
                      <p className="text-[10px] font-medium truncate">{selectedCompany.key_skills}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <GraduationCap className="h-2.5 w-2.5" /> Background
                      </p>
                      <p className="text-[10px] font-medium truncate">{selectedCompany.experience_level}</p>
                   </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[480px] items-center justify-center rounded-2xl border border-dashed border-border bg-white text-sm text-muted-foreground shadow-sm">
              <div className="text-center p-6">
                <div className="relative mx-auto mb-4 inline-flex p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Mail className="h-10 w-10 text-muted-foreground/30" />
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white flex items-center justify-center border border-border shadow-xs">
                    <Eye className="h-3.5 w-3.5 text-outly-accent" />
                  </div>
                </div>
                <p className="font-bold text-foreground text-base">Selection Required</p>
                <p className="mt-1.5 text-xs text-muted-foreground max-w-[220px] leading-relaxed">
                  Pick a target lead from the pipeline list on the left to preview and edit their personalized AI outreach email.
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
      </LockedFeatureGuard>
    </>
  );
}
