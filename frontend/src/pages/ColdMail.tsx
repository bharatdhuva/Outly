import { useState, useRef, useEffect } from "react";
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
  const [isAdding, setIsAdding] = useState(false);
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
  const [generateProvider, setGenerateProvider] = useState<"gemini" | "grok">("gemini");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Company>>({});
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["coldmail", "companies"],
    queryFn: api.coldmail.companies,
    refetchInterval: 5000,
  });

  const selectedCompany = companies.find((c: Company) => c.id === selected);

  useEffect(() => {
    if (!settings) return;
    setNewCompany((current) => ({
      ...current,
      sender_name: current.sender_name || settings.full_name || "",
      sender_location: current.sender_location || settings.target_cities.split(",")[0]?.trim() || "",
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
    mutationFn: (data: Partial<Company>) => api.coldmail.create(data as any),
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
        key_skills: "React, TypeScript, Node.js",
        experience_level: "3rd year CS student",
        sender_name: settings?.full_name || "",
        sender_location: settings?.target_cities.split(",")[0]?.trim() || "",
        personalization_hook: "",
      });
      toast.success("Lead added successfully");
    },
    onError: (e) => toast.error(String(e)),
  });

  const generateMutation = useMutation({
    mutationFn: (provider: "gemini" | "grok") => api.coldmail.generateAll(provider),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coldmail"] });
      toast.success(`Generated ${data.generated} mails`);
    },
    onError: (e) => toast.error(String(e)),
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
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        Loading...
      </div>
    );

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

      <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cold Mail Manager
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-personalized outreach pipeline
          </p>
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                Add Manually
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      required
                      placeholder="e.g. Resilient Tech"
                      value={newCompany.company_name}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, company_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website (optional)</Label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={newCompany.website_url || ""}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, website_url: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Target Person Name</Label>
                    <Input
                      placeholder="Sagar Vora"
                      value={newCompany.target_person_name || ""}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, target_person_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Email</Label>
                    <Input
                      required
                      type="email"
                      placeholder="sagar@resilient.tech"
                      value={newCompany.hr_email}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, hr_email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Target Role</Label>
                    <Input
                      placeholder="Managing Partner"
                      value={newCompany.target_person_role || ""}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, target_person_role: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role You Are Applying For</Label>
                    <Input
                      placeholder="Full Stack Developer"
                      value={newCompany.role}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, role: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Personalization Hook (Mental Note)</Label>
                  <Textarea
                    placeholder="e.g. They are ERPNext partners and building India Compliance app."
                    value={newCompany.personalization_hook || ""}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, personalization_hook: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>My Name</Label>
                    <Input
                      value={newCompany.sender_name || ""}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, sender_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>My Location</Label>
                    <Input
                      value={newCompany.sender_location || ""}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, sender_location: e.target.value })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    onClick={handleCreateClick}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Adding..." : "Add Lead"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload CSV
          </Button>
          <div className="flex rounded-md border border-border overflow-hidden">
            <Button
              size="sm"
              variant="ghost"
              className={`rounded-none border-r border-border gap-2 ${generateProvider === "gemini" ? "bg-accent" : ""}`}
              onClick={() => setGenerateProvider("gemini")}
            >
              Gemini
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`rounded-none gap-2 ${generateProvider === "grok" ? "bg-accent" : ""}`}
              onClick={() => setGenerateProvider("grok")}
            >
              Groq
            </Button>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => generateMutation.mutate(generateProvider)}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {generateMutation.isPending ? "Generating..." : `Generate All (${generateProvider})`}
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pending", count: counts.pending, color: "text-warning" },
          { label: "Approved", count: counts.approved, color: "text-primary" },
          { label: "Sent", count: counts.sent, color: "text-success" },
          { label: "Replied", count: counts.replied, color: "text-info" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2"
          >
            <span className={`font-mono text-lg font-bold ${s.color}`}>
              {s.count}
            </span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3 bg-muted/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-muted-foreground">Lead Pipeline</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => approveAllMutation.mutate()}
                  disabled={counts.approved === 0 || approveAllMutation.isPending}
                >
                  <Check className="h-3 w-3" /> Approve All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-primary"
                  onClick={() => sendApprovedMutation.mutate()}
                  disabled={
                    counts.approved === 0 || sendApprovedMutation.isPending
                  }
                >
                  <Send className="h-3 w-3" /> Send Approved
                </Button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-auto custom-scrollbar">
            {companies.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
                <p>No leads found</p>
                <p className="mt-1 text-xs opacity-60">
                  Upload a CSV or add a company manually to start
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
                    }}
                    className={`flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition-all hover:bg-accent/50 sm:flex-nowrap sm:gap-4 ${
                      selected === company.id
                        ? "bg-accent border-l-2 border-l-primary"
                        : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted font-mono text-xs font-bold text-muted-foreground shrink-0 overflow-hidden border border-border">
                      {company.company_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {company.company_name}
                        </p>
                        {company.website_url && (
                           <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {company.role}
                      </p>
                    </div>
                    <div className="order-4 flex items-center gap-0.5 sm:order-none">
                      {pipelineOrder.map((_, si) => (
                        <div
                          key={si}
                          className={`h-1 w-3 rounded-full ${si <= stepIdx ? "bg-primary" : "bg-border"}`}
                        />
                      ))}
                    </div>
                    <div className="order-3 sm:order-none">
                      <StatusBadge status={company.status} />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="order-5 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive sm:order-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(company);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedCompany ? (
            <div className="space-y-6 rounded-xl border border-border bg-card p-4 animate-slide-in sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedCompany.company_name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={selectedCompany.status} />
                    <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                      Since {new Date(selectedCompany.created_at).toLocaleDateString()}
                    </span>
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

              <div className="grid gap-4 border-y border-border py-4 sm:grid-cols-2">
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

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground/60 mb-2 block">
                    AI Draft Content
                  </label>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-bold text-foreground mb-3 border-b border-border pb-2">
                       {selectedCompany.generated_subject || "Subject will appear here"}
                    </p>
                    <div className="font-mono text-[11px] leading-relaxed text-secondary-foreground whitespace-pre-wrap">
                      {selectedCompany.generated_mail || "No draft generated yet."}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                    {["pending", "scraped", "mail_generated", "approved"].includes(selectedCompany.status) && (
                      <div className="flex w-full flex-col gap-2 sm:flex-1 sm:flex-row">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2 h-10 shadow-lg shadow-primary/10"
                          disabled={loadingId === selectedCompany.id}
                          onClick={() => {
                            setLoadingId(selectedCompany.id);
                            api.coldmail.scrape(selectedCompany.id).then(() => {
                              api.coldmail.generate(selectedCompany.id, "gemini").then(() => {
                                queryClient.invalidateQueries({ queryKey: ["coldmail"] });
                                toast.success("Mail generated with Gemini");
                                setLoadingId(null);
                              }).catch((e) => {
                                toast.error(String(e));
                                queryClient.invalidateQueries({ queryKey: ["coldmail"] });
                                setLoadingId(null);
                              });
                            }).catch((e) => {
                              toast.error(String(e));
                              setLoadingId(null);
                            });
                          }}
                        >
                          {loadingId === selectedCompany.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Gemini
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2 h-10 shadow-lg shadow-info/10"
                          disabled={loadingId === selectedCompany.id}
                          onClick={() => {
                            setLoadingId(selectedCompany.id);
                            api.coldmail.scrape(selectedCompany.id).then(() => {
                              api.coldmail.generate(selectedCompany.id, "grok").then(() => {
                                queryClient.invalidateQueries({ queryKey: ["coldmail"] });
                                toast.success("Mail generated with Grok");
                                setLoadingId(null);
                              }).catch((e) => {
                                toast.error(String(e));
                                queryClient.invalidateQueries({ queryKey: ["coldmail"] });
                                setLoadingId(null);
                              });
                            }).catch((e) => {
                              toast.error(String(e));
                              setLoadingId(null);
                            });
                          }}
                        >
                          {loadingId === selectedCompany.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Groq
                        </Button>
                      </div>
                    )}
                  {["mail_generated", "approved"].includes(selectedCompany.status) && (
                     <Button
                      size="sm"
                      variant={selectedCompany.status === "approved" ? "default" : "outline"}
                      className={`flex-1 gap-2 h-10 ${selectedCompany.status === "approved" ? "bg-primary shadow-lg shadow-primary/20" : ""}`}
                      onClick={() => {
                        if (selectedCompany.status === "approved") {
                          sendApprovedMutation.mutate();
                        } else {
                          api.coldmail.approve(selectedCompany.id).then(() =>
                            queryClient.invalidateQueries({ queryKey: ["coldmail"] })
                          );
                        }
                      }}
                    >
                      {selectedCompany.status === "approved" ? <Send className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      {selectedCompany.status === "approved" ? "Send Now" : "Approve"}
                    </Button>
                  )}
                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 px-3"
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
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
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
                    className="h-10 px-3 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      setDeleteTarget(selectedCompany);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-3"
                    onClick={() => {
                      api.coldmail.skip(selectedCompany.id).then(() =>
                        queryClient.invalidateQueries({ queryKey: ["coldmail"] })
                      );
                    }}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Advanced info section */}
              <div className="pt-4 border-t border-border mt-4">
                 <button className="flex items-center justify-between w-full group">
                   <p className="text-[10px] font-bold uppercase text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                     Sender Profile Details
                   </p>
                   <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                 </button>
                 <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
            <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground sm:h-96">
              <div className="text-center">
                <div className="relative mx-auto mb-4">
                  <Mail className="h-12 w-12 text-muted-foreground/20" />
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center border border-border">
                    <Eye className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                </div>
                <p className="font-medium">Selection Required</p>
                <p className="mt-1 text-xs text-muted-foreground/50 max-w-[180px]">
                  Pick a lead from the list to preview their AI generation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
