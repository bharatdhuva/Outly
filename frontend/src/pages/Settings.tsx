import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
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
import DotLottieLoader from "@/components/DotLottieLoader";

interface SettingSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

const emptySettings: AppSettings = {
  full_name: "",
  target_roles: "",
  target_cities: "",
  skills: "",
  experience: "",
  phone: "",
  resume_drive_file_id: "",
  max_emails_per_day: "20",
  daily_summary_time: "08:00 PM IST",
  sender_email: "",
  gmailConfigured: false,
  whatsappConfigured: false,
};

function getEditableSettingsPayload(form: AppSettings) {
  return {
    full_name: form.full_name,
    target_roles: form.target_roles,
    target_cities: form.target_cities,
    skills: form.skills,
    experience: form.experience,
    phone: form.phone,
    resume_drive_file_id: form.resume_drive_file_id,
    max_emails_per_day: form.max_emails_per_day,
    daily_summary_time: form.daily_summary_time,
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

function SettingsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 space-y-8 animate-pulse pb-16">
      {/* Header Skeleton */}
      <div className="space-y-3 text-left">
        <div className="h-5 w-20 bg-slate-200 rounded-full" />
        <div className="h-9 w-64 bg-slate-200 rounded-xl" />
        <div className="h-4 w-96 max-w-full bg-slate-100 rounded-lg" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1 Skeleton */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 space-y-6">
          <div className="h-4 w-40 bg-slate-200 rounded-lg pb-2 border-b border-slate-100" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-20 bg-slate-100 rounded" />
                <div className="h-9 w-full bg-slate-50 border border-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Card 2 Skeleton */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="h-4 w-40 bg-slate-200 rounded-lg pb-2 border-b border-slate-100" />
            <div className="space-y-2">
              <div className="h-3 w-32 bg-slate-100 rounded" />
              <div className="h-14 w-full bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-full self-end mt-4" />
        </div>
      </div>
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
  const { data: userData } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.auth.me,
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
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error?.message || String(error) || "Could not save profile settings.",
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
    return <SettingsSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 space-y-8 animate-fade-in pb-16">
      
      {/* Hero text header */}
      <div className="space-y-3 text-left">
        <span className="text-xs font-extrabold tracking-[0.2em] text-outly-accent uppercase bg-outly-accent/5 px-3 py-1.5 rounded-full inline-block">
          SETTINGS
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
          Account & Profile Preferences
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
          Manage your career details, target job roles, target locations, and integration preferences for automated applications.
        </p>
      </div>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate(form);
        }}
        className="space-y-6"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* Profile & Target Career Context */}
          <div className="rounded-2xl border border-border bg-white p-4 sm:p-6 shadow-sm space-y-5">
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
                  placeholder={userData?.fullName || userData?.name ? `e.g. ${userData.fullName || userData.name}` : "e.g. Your Name"}
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
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Tech Stack / Key Skills</label>
                <Input 
                  value={form.skills} 
                  onChange={(e) => updateField("skills", e.target.value)} 
                  placeholder="e.g. React, TypeScript, Node.js, Go"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Experience / Background</label>
                <Input 
                  value={form.experience} 
                  onChange={(e) => updateField("experience", e.target.value)} 
                  placeholder="e.g. 3rd year CS student at MSU Baroda"
                  className="h-10 text-xs rounded-xl"
                />
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
            </div>
          </div>

          {/* Integrations & Account */}
          <div className="rounded-2xl border border-border bg-white p-4 sm:p-6 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileText className="h-4 w-4 text-outly-accent" />
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/80">
                  Account Integrations
                </h2>
              </div>

              <div className="space-y-4">

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-foreground/80">Connected Sender Email</label>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 overflow-hidden">
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
                type="submit" 
                disabled={saveMutation.isPending} 
                className="gap-2 bg-outly-accent text-white hover:brightness-110 shadow-md shadow-outly-accent/20 rounded-full px-8 py-3 font-semibold h-11 text-sm cursor-pointer w-full sm:w-auto"
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saveMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
