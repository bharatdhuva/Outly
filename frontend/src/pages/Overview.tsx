import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  FileText,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Star,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { QueueStatusBar } from "@/components/QueueStatusBar";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const iconMap: Record<string, typeof CheckCircle> = {
  mail_sent: CheckCircle,
  job_applied: CheckCircle,
  mail_failed: AlertTriangle,
  captcha: XCircle,
};

const colorMap: Record<string, string> = {
  mail_sent: "text-success",
  job_applied: "text-success",
  mail_failed: "text-warning",
  captcha: "text-destructive",
};

export default function OverviewPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: api.dashboard.stats,
    refetchInterval: 5000,
    retry: 1,
  });
  const { data: activity } = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: api.dashboard.activity,
    refetchInterval: 5000,
  });
  const { data: queueStatus } = useQuery({
    queryKey: ["dashboard", "queue"],
    queryFn: api.dashboard.queueStatus,
    refetchInterval: 3000,
  });
  const { data: systemStatus } = useQuery({
    queryKey: ["dashboard", "system"],
    queryFn: api.dashboard.systemStatus,
    refetchInterval: 10000,
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });

  const weeklyData = [
    { day: "Mon", mails: stats?.mailsToday ?? 0 },
    { day: "Tue", mails: 0 },
    { day: "Wed", mails: 0 },
    { day: "Thu", mails: 0 },
    { day: "Fri", mails: 0 },
    { day: "Sat", mails: 0 },
    { day: "Sun", mails: 0 },
  ];

  const systemStatusList = [
    {
      label: "Mail Queue",
      value: `${queueStatus?.mailPending ?? 0} pending`,
      status: "active",
    },
    {
      label: "Redis",
      value: systemStatus?.redis ? "Connected" : "Disconnected",
      status: systemStatus?.redis ? "active" : "idle",
    },
    {
      label: "Gmail OAuth",
      value: systemStatus?.gmail ? "Authenticated" : "Not connected",
      status: systemStatus?.gmail ? "active" : "idle",
    },
    {
      label: "LinkedIn Mode",
      value: systemStatus?.linkedinMode === "manual" ? "Manual (Safe)" : systemStatus?.linkedinMode ?? "Unknown",
      status: "active",
    },
    {
      label: "LinkedIn Session",
      value: systemStatus?.linkedin ? "Valid" : "Setup required",
      status: systemStatus?.linkedin ? "active" : "idle",
    },
    {
      label: "WhatsApp",
      value: systemStatus?.whatsapp ? "Connected" : "Not configured",
      status: systemStatus?.whatsapp ? "active" : "idle",
    },
    {
      label: "Next Weekly Post",
      value: systemStatus?.nextWeeklyPostLabel ?? "Not scheduled",
      status: "scheduled",
    },
  ];

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { color: string; name: string; value: number }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
        <p className="mb-1 font-medium text-foreground">{label}</p>
        {payload.map((point) => (
          <p key={point.name} style={{ color: point.color }}>
            {point.name}: {point.value}
          </p>
        ))}
      </div>
    );
  };

  if (statsLoading && !stats && !statsError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2">
        <AlertTriangle className="h-12 w-12 text-warning" />
        <p className="text-muted-foreground">Backend offline. Start it with `npm run dev`.</p>
        <p className="text-xs text-muted-foreground">The dashboard will reconnect automatically when the API is available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {settings?.full_name ? `${settings.full_name}'s automation dashboard` : "Your career automation at a glance"}
          </p>
        </div>
        {stats && stats.mailsSent > 0 && (
          <div className="flex w-full items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-3 py-1.5 sm:w-auto">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-medium text-success">{stats.replyRate}% reply rate</span>
          </div>
        )}
      </div>

      <QueueStatusBar
        mailPending={queueStatus?.mailPending ?? 0}
        applyProcessing={0}
        nextCron={systemStatus?.nextWeeklyPostLabel ?? stats?.nextWeeklyPostLabel ?? "Not scheduled"}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <StatCard
          title="Brand Score"
          value={(stats?.linkedinPosts ?? 0) * 10 + (stats?.twitterPosts ?? 0) * 5 + (stats?.redditPosts ?? 0) * 8}
          icon={Star}
          variant="primary"
          subtitle="Total influence"
        />
        <StatCard
          title="Mails Sent"
          value={stats?.mailsSent ?? 0}
          icon={Mail}
          variant="primary"
          trend={stats?.mailsToday ? { value: `+${stats.mailsToday} today`, positive: true } : undefined}
        />
        <StatCard
          title="LinkedIn Posts"
          value={stats?.linkedinPosts ?? 0}
          icon={FileText}
          subtitle="Manual posting"
        />
        <StatCard
          title="Replies"
          value={stats?.replies ?? 0}
          icon={MessageSquare}
          variant="warning"
          trend={stats?.replyRate ? { value: `${stats.replyRate}% rate`, positive: true } : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Weekly Activity</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barGap={4} barCategoryGap="30%">
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(228 10% 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(228 10% 55%)" }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(228 12% 20% / 0.5)" }} />
              <Bar dataKey="mails" name="Mails" fill="hsl(24 95% 53%)" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
          <div className="space-y-0.5">
            {(activity ?? []).length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No activity yet</p>
            ) : (
              (activity ?? []).map((item, index) => {
                const Icon = iconMap[item.type] ?? CheckCircle;
                const color = colorMap[item.type] ?? "text-muted-foreground";
                const time = new Date(item.created_at).toLocaleString();
                return (
                  <div key={index} className="flex flex-col gap-2 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50 sm:flex-row sm:items-start">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{item.message}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground sm:text-right">{time}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">System Status</h2>
          <div className="space-y-3">
            {systemStatusList.map((item) => (
              <div key={item.label} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground">{item.value}</span>
                  <div
                    className={`h-2 w-2 rounded-full ${
                      item.status === "active" ? "bg-success" : item.status === "idle" ? "bg-warning" : "bg-info"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
