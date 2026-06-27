import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Linkedin,
  Loader2,
  Mail as MailIcon,
  MessageSquare,
  Save,
  Sliders,
  User,
  Plus,
  Trash2,
  Check,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, type AppSettings, type ResumeVaultItem } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface SettingSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

const emptySettings: AppSettings = {
  full_name: "",
  target_roles: "",
  target_cities: "",
  phone: "",
  resume_drive_file_id: "",
  weekly_post_enabled: "true",
  daily_linkedin_draft_enabled: "true",
  max_emails_per_day: "20",
  max_applies_per_session: "15",
  weekly_post_day: "Monday",
  weekly_post_time: "09:00 AM IST",
  daily_summary_time: "08:00 PM IST",
  linkedin_headline: "Career Autopilot",
  sender_email: "",
  gmailConfigured: false,
  linkedinSessionValid: false,
  whatsappConfigured: false,
};

function getEditableSettingsPayload(form: AppSettings) {
  return {
    full_name: form.full_name,
    target_roles: form.target_roles,
    target_cities: form.target_cities,
    phone: form.phone,
    resume_drive_file_id: form.resume_drive_file_id,
    weekly_post_enabled: form.weekly_post_enabled,
    daily_linkedin_draft_enabled: form.daily_linkedin_draft_enabled,
    max_emails_per_day: form.max_emails_per_day,
    max_applies_per_session: form.max_applies_per_session,
    weekly_post_day: form.weekly_post_day,
    weekly_post_time: form.weekly_post_time,
    daily_summary_time: form.daily_summary_time,
    linkedin_headline: form.linkedin_headline,
  };
}

function SettingSection({ title, icon, children }: SettingSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <label className="text-sm text-secondary-foreground sm:shrink-0">{label}</label>
      <div className="w-full sm:max-w-xs sm:flex-1">{children}</div>
    </div>
  );
}

function StatusIndicator({
  connected,
  label,
}: {
  connected: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {connected ? (
        <CheckCircle className="h-4 w-4 text-success" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-warning" />
      )}
      <span className="text-sm text-foreground">{label}</span>
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });
  const [form, setForm] = useState<AppSettings>(emptySettings);

  // Active Tab: config | vault
  const [activeTab, setActiveTab] = useState<"config" | "vault">("config");

  // Vault upload form
  const [vaultFilename, setVaultFilename] = useState("");
  const [vaultLabel, setVaultLabel] = useState("");
  const [vaultContent, setVaultContent] = useState("");
  const [isVaultDefault, setIsVaultDefault] = useState(false);

  // Load vault list
  const { data: resumes = [], refetch: refetchResumes } = useQuery({
    queryKey: ["resume", "list"],
    queryFn: api.resume.list,
    enabled: activeTab === "vault",
  });

  useEffect(() => {
    if (data) {
      setForm({ ...emptySettings, ...data });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (settings: AppSettings) => api.settings.update(getEditableSettingsPayload(settings)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["settings"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      toast({ title: "Settings saved", description: "Frontend and backend now use the updated values." });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: String(error),
      });
    },
  });

  const testResumeMutation = useMutation({
    mutationFn: api.settings.testResume,
    onSuccess: (result) => {
      toast({
        title: result.ok ? "Resume check passed" : "Resume check failed",
        description: result.ok ? "Google Drive resume download is working." : "Resume download did not return a file.",
      });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Resume test failed", description: String(error) });
    },
  });

  const testWhatsAppMutation = useMutation({
    mutationFn: api.settings.testWhatsApp,
    onSuccess: (result) => {
      toast({
        title: result.ok ? "WhatsApp message sent" : "WhatsApp not configured",
        description: result.ok ? "A live test message was sent successfully." : "Check Twilio credentials or the destination number.",
      });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "WhatsApp test failed", description: String(error) });
    },
  });

  // Vault upload handlers
  const handleVaultFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVaultFilename(file.name);
    try {
      const text = await file.text();
      setVaultContent(text);
      toast({
        title: "File Read Complete",
        description: `Loaded ${file.name} successfully.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error reading file",
        description: String(err),
      });
    }
  };

  const addResumeMutation = useMutation({
    mutationFn: () =>
      api.resume.create({
        filename: vaultFilename || "resume_text.txt",
        label: vaultLabel,
        content: vaultContent,
        is_default: isVaultDefault,
      }),
    onSuccess: () => {
      toast({
        title: "Resume Added",
        description: "Your resume version was uploaded to the vault.",
      });
      setVaultFilename("");
      setVaultLabel("");
      setVaultContent("");
      setIsVaultDefault(false);
      refetchResumes();
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error saving resume",
        description: String(err),
      });
    },
  });

  const setDefaultResumeMutation = useMutation({
    mutationFn: (id: number) => api.resume.setDefault(id),
    onSuccess: () => {
      toast({
        title: "Default Resume Set",
        description: "Your default selection has been updated.",
      });
      refetchResumes();
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error setting default",
        description: String(err),
      });
    },
  });

  const deleteResumeMutation = useMutation({
    mutationFn: (id: number) => api.resume.delete(id),
    onSuccess: () => {
      toast({
        title: "Resume Deleted",
        description: "Version removed from your vault.",
      });
      refetchResumes();
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: String(err),
      });
    },
  });

  const updateField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-muted-foreground font-medium">
        <Loader2 className="h-6 w-6 animate-spin text-outly-accent mr-2" /> Loading settings...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-2 py-4 sm:py-8 space-y-8 animate-fade-in pb-16">
      
      {/* Hero text header */}
      <div className="space-y-3 text-left">
        <span className="text-xs font-extrabold tracking-[0.2em] text-outly-accent uppercase bg-outly-accent/5 px-3 py-1.5 rounded-full inline-block">
          SETTINGS
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
          Account & Profile Preferences
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
          Manage your career details, target job roles, target locations, and stored resume versions for automated applications.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("config")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all relative ${
            activeTab === "config"
              ? "text-outly-accent border-b-2 border-outly-accent font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab("vault")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all relative ${
            activeTab === "vault"
              ? "text-outly-accent border-b-2 border-outly-accent font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Resume Vault ({resumes.length})
        </button>
      </div>

      {activeTab === "config" ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* Profile & Target Career Context */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="h-4 w-4 text-outly-accent" />
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/80">
                  Profile & Career Context
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Full Name</label>
                  <Input 
                    value={form.full_name} 
                    onChange={(e) => updateField("full_name", e.target.value)} 
                    placeholder="e.g. Bharat Ahir"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Target Roles</label>
                  <Input 
                    value={form.target_roles} 
                    onChange={(e) => updateField("target_roles", e.target.value)} 
                    placeholder="e.g. Software Development Engineer, Full Stack"
                    className="h-10 text-xs rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground">Used by Job Search and Cold Outreach to match relevant positions.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Target Cities / Locations</label>
                  <Input 
                    value={form.target_cities} 
                    onChange={(e) => updateField("target_cities", e.target.value)} 
                    placeholder="e.g. Mumbai, Bangalore, Remote"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">LinkedIn Headline / Tagline</label>
                  <Input 
                    value={form.linkedin_headline} 
                    onChange={(e) => updateField("linkedin_headline", e.target.value)} 
                    placeholder="e.g. Full Stack Engineer | React & Node.js"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Resume & Integration Links */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <FileText className="h-4 w-4 text-outly-accent" />
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/80">
                    Resume & Integrations
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Google Drive Resume File ID</label>
                    <div className="flex gap-2">
                      <Input
                        value={form.resume_drive_file_id}
                        onChange={(e) => updateField("resume_drive_file_id", e.target.value)}
                        placeholder="Paste Google Drive File ID"
                        className="font-mono text-xs h-10 rounded-xl flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => testResumeMutation.mutate()} 
                        disabled={testResumeMutation.isPending}
                        className="h-10 text-xs rounded-xl font-semibold px-4 shrink-0"
                      >
                        {testResumeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Test Link"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-semibold text-foreground/80">Connected Sender Email</label>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MailIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {form.sender_email || "No email connected"}
                        </span>
                      </div>
                      <StatusIndicator
                        connected={form.gmailConfigured}
                        label={form.gmailConfigured ? "Gmail OAuth Ready" : "Not Configured"}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button 
                  onClick={() => saveMutation.mutate(form)} 
                  disabled={saveMutation.isPending} 
                  className="gap-2 bg-outly-accent text-white hover:brightness-110 shadow-md shadow-outly-accent/20 rounded-full px-8 py-3 font-semibold h-11 text-sm cursor-pointer w-full sm:w-auto"
                >
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saveMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Resume Vault Tab */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upload panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Plus className="h-4 w-4 text-outly-accent" />
                Add Resume Version
              </h2>

              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Resume Label</label>
                  <Input
                    placeholder="e.g. SDE-1 Version"
                    value={vaultLabel}
                    onChange={(e) => setVaultLabel(e.target.value)}
                    className="bg-white border-border text-xs h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">File Upload (.txt)</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("vault-upload-input")?.click()}
                      className="w-full text-xs gap-2 h-10 rounded-xl font-semibold"
                    >
                      <UploadCloud className="h-4 w-4 text-outly-accent" />
                      {vaultFilename ? vaultFilename : "Select File"}
                    </Button>
                    <input
                      id="vault-upload-input"
                      type="file"
                      accept=".txt"
                      className="hidden"
                      onChange={handleVaultFileUpload}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Resume Raw Text</label>
                  <Textarea
                    placeholder="Paste resume experience or text directly..."
                    value={vaultContent}
                    onChange={(e) => setVaultContent(e.target.value)}
                    className="min-h-[140px] bg-white border-border text-xs leading-relaxed rounded-xl resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="vault-default-chk"
                    checked={isVaultDefault}
                    onChange={(e) => setIsVaultDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-outly-accent focus:ring-outly-accent accent-outly-accent bg-white cursor-pointer"
                  />
                  <label htmlFor="vault-default-chk" className="text-xs text-secondary-foreground font-semibold cursor-pointer select-none">
                    Set as default version
                  </label>
                </div>
              </div>

              <Button
                onClick={() => addResumeMutation.mutate()}
                disabled={!vaultLabel.trim() || !vaultContent.trim() || addResumeMutation.isPending}
                className="w-full bg-outly-accent text-white hover:brightness-110 rounded-full font-semibold h-10 text-xs shadow-md shadow-outly-accent/20 cursor-pointer mt-2"
              >
                {addResumeMutation.isPending ? "Adding..." : "Add to Vault"}
              </Button>
            </div>
          </div>

          {/* List panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/80 pb-2 border-b border-slate-100">
                Stored Resumes ({resumes.length})
              </h2>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {resumes.length === 0 ? (
                  <div className="py-16 border border-dashed border-border rounded-2xl text-center text-muted-foreground bg-slate-50/50">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm font-bold text-foreground">No stored resumes found</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload or paste a resume version to use across your tailored applications.</p>
                  </div>
                ) : (
                  resumes.map((item: ResumeVaultItem) => (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        item.is_default === 1
                          ? "border-outly-accent/40 bg-outly-accent/5 shadow-xs"
                          : "border-border bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-foreground text-sm truncate">{item.label}</h3>
                            {item.is_default === 1 ? (
                              <span className="rounded-full bg-outly-accent/10 border border-outly-accent/20 px-2.5 py-0.5 text-[10px] font-bold text-outly-accent flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Default
                              </span>
                            ) : (
                              <button
                                onClick={() => setDefaultResumeMutation.mutate(item.id)}
                                className="text-[11px] font-semibold text-muted-foreground hover:text-outly-accent transition-colors underline cursor-pointer"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            File: {item.filename}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60">
                            Added: {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                          onClick={() => deleteResumeMutation.mutate(item.id)}
                          disabled={deleteResumeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {item.content && (
                        <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3 max-h-[110px] overflow-y-auto">
                          <p className="text-xs leading-relaxed text-slate-700 font-mono whitespace-pre-wrap">
                            {item.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
