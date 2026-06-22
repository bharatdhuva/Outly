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
import { Slider } from "@/components/ui/slider";
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
      <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal configuration parameters and stored resume versions.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "config"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab("vault")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "vault"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Resume Vault
        </button>
      </div>

      {activeTab === "config" ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <SettingSection title="Profile" icon={<User className="h-4 w-4 text-primary" />}>
              <SettingRow label="Full Name">
                <Input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} />
              </SettingRow>
              <SettingRow label="LinkedIn Headline">
                <Input value={form.linkedin_headline} onChange={(e) => updateField("linkedin_headline", e.target.value)} />
              </SettingRow>
              <SettingRow label="Target Roles">
                <Input value={form.target_roles} onChange={(e) => updateField("target_roles", e.target.value)} />
              </SettingRow>
              <SettingRow label="Target Cities">
                <Input value={form.target_cities} onChange={(e) => updateField("target_cities", e.target.value)} />
              </SettingRow>
            </SettingSection>

            <SettingSection title="Resume Link" icon={<FileText className="h-4 w-4 text-primary" />}>
              <SettingRow label="Google Drive File ID">
                <Input
                  value={form.resume_drive_file_id}
                  onChange={(e) => updateField("resume_drive_file_id", e.target.value)}
                  className="font-mono text-xs"
                />
              </SettingRow>
              <div className="flex justify-start sm:justify-end">
                <Button variant="outline" size="sm" onClick={() => testResumeMutation.mutate()} disabled={testResumeMutation.isPending}>
                  {testResumeMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  Test Resume Download
                </Button>
              </div>
            </SettingSection>

            <SettingSection title="Gmail" icon={<MailIcon className="h-4 w-4 text-primary" />}>
              <StatusIndicator
                connected={form.gmailConfigured}
                label={form.gmailConfigured ? "OAuth configured" : "Gmail OAuth not configured"}
              />
              <SettingRow label="Sender Email">
                <Input value={form.sender_email} disabled className="font-mono text-xs" />
              </SettingRow>
            </SettingSection>

            <SettingSection title="LinkedIn Settings" icon={<Linkedin className="h-4 w-4 text-primary" />}>
              <StatusIndicator
                connected={form.linkedinSessionValid}
                label={form.linkedinSessionValid ? "Session valid" : "Session setup required"}
              />
              <SettingRow label="Weekly Post Day">
                <Input value={form.weekly_post_day} onChange={(e) => updateField("weekly_post_day", e.target.value)} />
              </SettingRow>
              <SettingRow label="Weekly Post Time">
                <Input value={form.weekly_post_time} onChange={(e) => updateField("weekly_post_time", e.target.value)} />
              </SettingRow>
            </SettingSection>

            <SettingSection title="WhatsApp" icon={<MessageSquare className="h-4 w-4 text-primary" />}>
              <StatusIndicator
                connected={form.whatsappConfigured}
                label={form.whatsappConfigured ? "Twilio connected" : "Twilio or number not configured"}
              />
              <SettingRow label="Destination Number">
                <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="font-mono text-xs" />
              </SettingRow>
              <div className="flex justify-start sm:justify-end">
                <Button variant="outline" size="sm" onClick={() => testWhatsAppMutation.mutate()} disabled={testWhatsAppMutation.isPending}>
                  {testWhatsAppMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  Send Test Message
                </Button>
              </div>
            </SettingSection>

            <SettingSection title="Limits" icon={<Sliders className="h-4 w-4 text-primary" />}>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-secondary-foreground">Max Emails / Day</span>
                  <span className="font-mono text-xs text-primary">{form.max_emails_per_day}</span>
                </div>
                <Slider
                  value={[Number(form.max_emails_per_day || 0)]}
                  onValueChange={(value) => updateField("max_emails_per_day", String(value[0]))}
                  max={50}
                  step={1}
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-secondary-foreground">Max Applies / Session</span>
                  <span className="font-mono text-xs text-primary">{form.max_applies_per_session}</span>
                </div>
                <Slider
                  value={[Number(form.max_applies_per_session || 0)]}
                  onValueChange={(value) => updateField("max_applies_per_session", String(value[0]))}
                  max={30}
                  step={1}
                />
              </div>
            </SettingSection>

            <SettingSection title="Schedule" icon={<Clock className="h-4 w-4 text-primary" />}>
              <SettingRow label="Daily Summary">
                <Input value={form.daily_summary_time} onChange={(e) => updateField("daily_summary_time", e.target.value)} />
              </SettingRow>
            </SettingSection>
          </div>

          <div className="flex justify-start sm:justify-end mt-6">
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-2">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saveMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </>
      ) : (
        /* Resume Vault Tab */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upload panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-primary" />
                Add Resume Version
              </h2>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Resume Label</label>
                  <Input
                    placeholder="e.g. SDE-1 Version"
                    value={vaultLabel}
                    onChange={(e) => setVaultLabel(e.target.value)}
                    className="bg-white border-border text-xs focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">File Upload (.txt)</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("vault-upload-input")?.click()}
                      className="w-full text-xs gap-2"
                    >
                      <UploadCloud className="h-4 w-4" />
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

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Resume Raw Text</label>
                  <Textarea
                    placeholder="Paste resume experience or text directly..."
                    value={vaultContent}
                    onChange={(e) => setVaultContent(e.target.value)}
                    className="min-h-[140px] bg-white border-border text-xs leading-relaxed focus-visible:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="vault-default-chk"
                    checked={isVaultDefault}
                    onChange={(e) => setIsVaultDefault(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary bg-white"
                  />
                  <label htmlFor="vault-default-chk" className="text-xs text-secondary-foreground font-medium">
                    Set as default version
                  </label>
                </div>
              </div>

              <Button
                onClick={() => addResumeMutation.mutate()}
                disabled={!vaultLabel.trim() || !vaultContent.trim() || addResumeMutation.isPending}
                className="w-full text-xs"
              >
                {addResumeMutation.isPending ? "Adding..." : "Add to Vault"}
              </Button>
            </div>
          </div>

          {/* List panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Stored Resumes ({resumes.length})
              </h2>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {resumes.length === 0 ? (
                  <div className="py-12 border border-dashed border-border rounded-lg text-center text-muted-foreground bg-muted/10">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-xs">No stored resumes found.</p>
                  </div>
                ) : (
                  resumes.map((item: ResumeVaultItem) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        item.is_default === 1
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/20 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground text-sm truncate">{item.label}</h3>
                            {item.is_default === 1 ? (
                              <span className="rounded-full bg-primary/20 border border-primary/30 px-2 py-0.5 text-[9px] font-bold text-primary flex items-center gap-1">
                                <Check className="h-2.5 w-2.5" />
                                Default
                              </span>
                            ) : (
                              <button
                                onClick={() => setDefaultResumeMutation.mutate(item.id)}
                                className="text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors underline"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            File: {item.filename}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60">
                            Added: {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => deleteResumeMutation.mutate(item.id)}
                          disabled={deleteResumeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {item.content && (
                        <div className="mt-3 bg-background/50 border border-border/50 rounded-lg p-2.5 max-h-[100px] overflow-y-auto">
                          <p className="text-[11px] leading-relaxed text-secondary-foreground font-mono whitespace-pre-wrap">
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
