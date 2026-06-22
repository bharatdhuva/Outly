import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  RadioTower,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { QueueStatusBar } from "@/components/QueueStatusBar";
import { StatCard } from "@/components/StatCard";
import { api } from "@/lib/api";

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

const quickActions = [
  {
    title: "Prepare cold mail",
    description: "Review target companies, queue outreach, and keep follow-ups moving.",
    href: "/cold-mail",
    icon: Mail,
  },
  {
    title: "Tailor resume",
    description: "Generate a role-specific resume before sending the next application.",
    href: "/resume-tailor",
    icon: FileText,
  },
  {
    title: "Tune settings",
    description: "Confirm identity, OAuth, and posting rules before automation runs.",
    href: "/settings",
    icon: Settings,
  },
];

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

  const brandScore =
    (stats?.linkedinPosts ?? 0) * 10 +
    (stats?.twitterPosts ?? 0) * 5 +
    (stats?.redditPosts ?? 0) * 8;

  const readiness = [
    { label: "Redis", ok: systemStatus?.redis, note: systemStatus?.redis ? "Connected" : "Queue storage offline" },
    { label: "Gmail", ok: systemStatus?.gmail, note: systemStatus?.gmail ? "Authenticated" : "OAuth required" },
    { label: "LinkedIn", ok: systemStatus?.linkedin, note: systemStatus?.linkedin ? "Session valid" : "Setup required" },
    { label: "WhatsApp", ok: systemStatus?.whatsapp, note: systemStatus?.whatsapp ? "Connected" : "Not configured" },
  ];

  const socialChannels = [
    { label: "LinkedIn", value: stats?.linkedinPosts ?? 0, href: "/linkedin-posts", icon: FileText },
    { label: "Twitter / X", value: stats?.twitterPosts ?? 0, href: "/twitter", icon: MessageSquare },
    { label: "Reddit", value: stats?.redditPosts ?? 0, href: "/reddit", icon: RadioTower },
    { label: "Telegram", value: systemStatus?.whatsapp ? "Live" : "Ready", href: "/telegram", icon: Send },
  ];

  const todayKey = new Date().toISOString().slice(0, 10);
  const activityByDay = new Map<string, number>();

  (activity ?? []).forEach((item) => {
    const isApplyActivity = item.type === "job_applied" || item.type === "mail_sent";
    if (!isApplyActivity) return;
    const key = new Date(item.created_at).toISOString().slice(0, 10);
    activityByDay.set(key, (activityByDay.get(key) ?? 0) + 1);
  });

  if ((stats?.mailsToday ?? 0) > 0) {
    activityByDay.set(todayKey, Math.max(activityByDay.get(todayKey) ?? 0, stats?.mailsToday ?? 0));
  }

  const streakDays = Array.from({ length: 35 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (34 - index));
    const key = date.toISOString().slice(0, 10);
    const count = activityByDay.get(key) ?? 0;
    return {
      key,
      count,
      label: date.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    };
  });

  let dailyApplyStreak = 0;
  for (let index = streakDays.length - 1; index >= 0; index -= 1) {
    if (streakDays[index].count === 0) break;
    dailyApplyStreak += 1;
  }

  const streakCellClass = (count: number) => {
    if (count >= 6) return "bg-primary";
    if (count >= 3) return "bg-primary/70";
    if (count >= 1) return "bg-primary/35";
    return "bg-secondary";
  };

  if (statsLoading && !stats && !statsError) {
    return (
      <div className="grid min-h-[460px] place-items-center">
        <div className="w-full max-w-xl rounded-md border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/10 shimmer" />
            <div className="space-y-2">
              <div className="h-3 w-48 rounded bg-muted shimmer" />
              <div className="h-3 w-28 rounded bg-muted shimmer" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-md bg-muted shimmer" />
            <div className="h-24 rounded-md bg-muted shimmer" />
            <div className="h-24 rounded-md bg-muted shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="grid min-h-[460px] place-items-center">
        <div className="w-full max-w-xl rounded-md border border-warning/25 bg-warning/5 p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-warning" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">Outly cannot reach the backend</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start the backend and this dashboard will reconnect automatically. The frontend is still available for layout review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-accent px-3 py-1 text-[12px] font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Outreach workspace
              </div>
              <h1 className="text-[28px] font-semibold leading-9 tracking-tight text-foreground sm:text-[34px] sm:leading-10">
                {settings?.full_name ? `${settings.full_name}'s launch desk` : "Launch desk for career outreach"}
              </h1>
              <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted-foreground">
                Outly keeps cold mail, resume tailoring, social posts, and channel health in one readable workspace.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-4 lg:min-w-56">
              <p className="text-[12px] font-medium text-muted-foreground">Reply rate</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[32px] font-semibold tracking-tight text-foreground">{stats?.replyRate ?? 0}%</span>
                <TrendingUp className="mb-2 h-5 w-5 text-success" />
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">{stats?.replies ?? 0} replies from {stats?.mailsSent ?? 0} sent mails</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-muted-foreground">Next scheduled post</p>
              <p className="mt-2 text-[17px] font-semibold text-foreground">
                {systemStatus?.nextWeeklyPostLabel ?? stats?.nextWeeklyPostLabel ?? "Not scheduled"}
              </p>
            </div>
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <Link
            to="/linkedin-posts"
            className="mt-6 inline-flex w-full items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            Manage content calendar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <QueueStatusBar
        mailPending={queueStatus?.mailPending ?? 0}
        applyProcessing={0}
        nextCron={systemStatus?.nextWeeklyPostLabel ?? stats?.nextWeeklyPostLabel ?? "Not scheduled"}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Brand Score" value={brandScore} icon={ShieldCheck} variant="primary" subtitle="LinkedIn, X, and Reddit signal" />
        <StatCard
          title="Mails Sent"
          value={stats?.mailsSent ?? 0}
          icon={Mail}
          variant="success"
          trend={stats?.mailsToday ? { value: `+${stats.mailsToday} today`, positive: true } : undefined}
        />
        <StatCard title="Social Posts" value={(stats?.linkedinPosts ?? 0) + (stats?.twitterPosts ?? 0) + (stats?.redditPosts ?? 0)} icon={RadioTower} subtitle="Published or prepared" />
        <StatCard title="Replies" value={stats?.replies ?? 0} icon={MessageSquare} variant="warning" subtitle="Responses captured" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Daily apply streak</h2>
              <p className="text-[13px] text-muted-foreground">A GitHub-style view of daily applications and outreach activity.</p>
            </div>
            <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
              {dailyApplyStreak} day streak
            </span>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="min-w-[560px] rounded-xl border border-border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[12px] font-medium text-muted-foreground">Last 35 days</p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>Less</span>
                  <span className="h-3 w-3 rounded-[3px] bg-secondary" />
                  <span className="h-3 w-3 rounded-[3px] bg-primary/35" />
                  <span className="h-3 w-3 rounded-[3px] bg-primary/70" />
                  <span className="h-3 w-3 rounded-[3px] bg-primary" />
                  <span>More</span>
                </div>
              </div>
              <div className="grid grid-flow-col grid-rows-7 gap-1.5">
                {streakDays.map((day) => (
                  <div
                    key={day.key}
                    title={`${day.label}: ${day.count} ${day.count === 1 ? "apply" : "applies"}`}
                    className={`h-4 w-4 rounded-[4px] ring-1 ring-slate-900/5 ${streakCellClass(day.count)}`}
                    aria-label={`${day.label}: ${day.count} applies`}
                  />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Today</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{activityByDay.get(todayKey) ?? 0}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Current streak</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{dailyApplyStreak}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Active days</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{streakDays.filter((day) => day.count > 0).length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-[15px] font-semibold text-foreground">Readiness checklist</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">The core integrations that decide whether automation can run.</p>
          <div className="mt-5 space-y-3">
            {readiness.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary p-3">
                <div>
                  <p className="text-[13px] font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{item.note}</p>
                </div>
                <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.ok ? "bg-success" : "bg-warning"}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-[15px] font-semibold text-foreground">Next best actions</h2>
          <div className="mt-4 space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className="group flex items-start gap-3 rounded-lg border border-border bg-white p-3 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground">{action.title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="mt-2 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Recent activity</h2>
              <p className="text-[13px] text-muted-foreground">Latest system events and campaign outcomes.</p>
            </div>
            <Link to="/logs" className="inline-flex items-center gap-2 text-[13px] font-medium text-primary">
              View logs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-1">
            {(activity ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-secondary p-6 text-center">
                <p className="text-[13px] font-medium text-foreground">No activity recorded yet</p>
                <p className="mt-1 text-[12px] text-muted-foreground">Run a campaign or connect an integration to start filling this feed.</p>
              </div>
            ) : (
              (activity ?? []).slice(0, 8).map((item, index) => {
                const Icon = iconMap[item.type] ?? CheckCircle;
                const color = colorMap[item.type] ?? "text-muted-foreground";
                const time = new Date(item.created_at).toLocaleString();
                return (
                  <div key={index} className="flex flex-col gap-2 rounded-md px-3 py-3 transition-colors hover:bg-accent sm:flex-row sm:items-start">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                    <p className="min-w-0 flex-1 text-[13px] text-foreground">{item.message}</p>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground sm:text-right">{time}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {socialChannels.map((channel) => (
          <Link key={channel.label} to={channel.href} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40">
            <div className="flex items-center justify-between">
              <channel.icon className="h-5 w-5 text-primary" />
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-4 text-[13px] font-medium text-muted-foreground">{channel.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{channel.value}</p>
          </Link>
        ))}
      </section>

      {/* New Roadmap Sections */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-[15px] font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Link
            to="/cold-mail"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            ✉ New Cold Email
          </Link>
          <Link
            to="/resume-tailor"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            📄 Tailor Resume
          </Link>
          <Link
            to="/ats-score"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            📊 Check ATS Score
          </Link>
          <Link
            to="/linkedin-posts"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            📅 Schedule Post
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Application Pipeline</h2>
            <p className="text-[13px] text-muted-foreground">Preview of your active job applications tracker.</p>
          </div>
          <Link to="/applications" className="text-[13px] font-medium text-primary hover:underline">
            View full tracker →
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {[
            { name: "Saved", count: stats?.savedCount ?? 0, bg: "bg-slate-500/10 border-slate-500/20 text-slate-400" },
            { name: "Applied", count: stats?.appliedCount ?? 0, bg: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
            { name: "Interview", count: stats?.interviewCount ?? 0, bg: "bg-warning/10 border-warning/20 text-warning" },
            { name: "Offer", count: stats?.offerCount ?? 0, bg: "bg-success/10 border-success/20 text-success" },
            { name: "Rejected", count: stats?.rejectedCount ?? 0, bg: "bg-destructive/10 border-destructive/20 text-destructive" },
          ].map((col) => (
            <div
              key={col.name}
              className={`flex flex-col flex-1 min-w-[120px] items-center justify-between rounded-lg border p-4 ${col.bg}`}
            >
              <span className="text-[13px] font-semibold">{col.name}</span>
              <span className="mt-2 rounded-full bg-current/10 px-2.5 py-0.5 text-[14px] font-bold">{col.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Recent Activity Feed</h2>
            <p className="text-[13px] text-muted-foreground">Log of recent automation events and actions.</p>
          </div>
          <Link to="/logs" className="text-[13px] font-medium text-primary hover:underline">
            View all logs →
          </Link>
        </div>
        <div className="space-y-2">
          {(activity ?? []).length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4 text-center">No activity recorded yet.</p>
          ) : (
            (activity ?? []).slice(0, 5).map((item, idx) => {
              let Icon = CheckCircle;
              if (item.type.includes("mail")) Icon = Mail;
              if (item.type.includes("post") || item.type.includes("tweet")) Icon = FileText;
              
              const timeAgo = (() => {
                const diffMs = Date.now() - new Date(item.created_at).getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                if (diffMins < 1) return "Just now";
                if (diffMins < 60) return `${diffMins}m ago`;
                if (diffHours < 24) return `${diffHours}h ago`;
                return new Date(item.created_at).toLocaleDateString();
              })();

              return (
                <div key={idx} className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[13px] font-medium text-foreground">{item.message}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
