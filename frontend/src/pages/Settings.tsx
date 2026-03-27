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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { api, type AppSettings } from "@/lib/api";
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          These values are loaded from the backend settings store and reused across the app.
        </p>
      </div>

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

        <SettingSection title="Resume" icon={<FileText className="h-4 w-4 text-primary" />}>
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

        <SettingSection title="LinkedIn" icon={<Linkedin className="h-4 w-4 text-primary" />}>
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

      <div className="flex justify-start sm:justify-end">
        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-2">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
