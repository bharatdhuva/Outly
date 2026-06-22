import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  Mail,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

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
  const { data: systemStatus } = useQuery({
    queryKey: ["dashboard", "system"],
    queryFn: api.dashboard.systemStatus,
    refetchInterval: 10000,
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });

  const statusBadges = [
    { name: "Redis", ok: systemStatus?.redis },
    { name: "Gmail", ok: systemStatus?.gmail },
    { name: "LinkedIn", ok: systemStatus?.linkedin },
    { name: "WhatsApp", ok: systemStatus?.whatsapp },
    { name: "Telegram", ok: systemStatus?.telegram }
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
    <div className="animate-fade-in space-y-5">
      {/* 1. Hero Section */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Left Hero Card */}
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] flex flex-col justify-between">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-accent px-3 py-1 text-[12px] font-medium text-primary w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                Outreach Workspace
              </div>
              {/* Integration Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {statusBadges.map((badge) => (
                  <div key={badge.name} className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] font-medium">
                    <span className={`h-1.5 w-1.5 rounded-full ${badge.ok ? "bg-success" : "bg-warning"}`} />
                    <span className="text-muted-foreground">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <h1 className="mt-4 text-[24px] font-semibold tracking-tight text-foreground sm:text-[28px]">
              {settings?.full_name ? `${settings.full_name}'s launch desk` : "Launch desk for career outreach"}
            </h1>
            <p className="mt-2 text-[13.5px] text-muted-foreground leading-5">
              Outly keeps cold mail, resume tailoring, social posts, and channel health in one readable workspace.
            </p>
          </div>
        </div>

        {/* Right side stats cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-1">
          {/* Reply Rate Card */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[12px] font-medium">Reply Rate</span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">{stats?.replyRate ?? 0}%</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stats?.replies ?? 0} replies / {stats?.mailsSent ?? 0} mails</p>
            </div>
          </div>

          {/* Next Scheduled Post Card */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[12px] font-medium">Next Post</span>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2">
              <span className="text-[13px] font-semibold text-foreground block truncate">
                {systemStatus?.nextWeeklyPostLabel ?? stats?.nextWeeklyPostLabel ?? "Not scheduled"}
              </span>
              <Link to="/linkedin-posts" className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 mt-1">
                Manage calendar <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Actions Bar */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-[15px] font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Link
            to="/cold-mail"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-[13px] font-medium text-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-accent hover:text-primary"
          >
            <span className="text-base">✉</span> New Cold Email
          </Link>
          <Link
            to="/resume-tailor"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-[13px] font-medium text-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-accent hover:text-primary"
          >
            <span className="text-base">📄</span> Tailor Resume
          </Link>
          <Link
            to="/ats-score"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-[13px] font-medium text-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-accent hover:text-primary"
          >
            <span className="text-base">📊</span> Check ATS Score
          </Link>
          <Link
            to="/applications"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-[13px] font-medium text-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-accent hover:text-primary"
          >
            <span className="text-base">📋</span> Track Application
          </Link>
        </div>
      </section>

      {/* 3. Application Pipeline (Mini Kanban) */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Application Pipeline</h2>
            <p className="text-[12px] text-muted-foreground">Active tracker status counts</p>
          </div>
          <Link to="/applications" className="text-[12px] font-medium text-primary hover:underline flex items-center gap-1">
            View full tracker <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
          {[
            { name: "Saved", count: stats?.savedCount ?? 0, bg: "bg-slate-500/5 border-slate-500/15 text-slate-500" },
            { name: "Applied", count: stats?.appliedCount ?? 0, bg: "bg-blue-500/5 border-blue-500/15 text-blue-500" },
            { name: "Interview", count: stats?.interviewCount ?? 0, bg: "bg-warning/5 border-warning/15 text-warning" },
            { name: "Offer", count: stats?.offerCount ?? 0, bg: "bg-success/5 border-success/15 text-success" },
            { name: "Rejected", count: stats?.rejectedCount ?? 0, bg: "bg-destructive/5 border-destructive/15 text-destructive" },
          ].map((col) => (
            <div
              key={col.name}
              className={`flex flex-col items-center justify-center rounded-lg border p-3 ${col.bg}`}
            >
              <span className="text-[12px] font-semibold opacity-95">{col.name}</span>
              <span className="mt-1 text-lg font-bold">{col.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Daily Apply Streak */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] min-w-0">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Daily Apply Streak</h2>
            <p className="text-[12px] text-muted-foreground">GitHub-style view of applications and outreach activity.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-[12px] font-medium text-foreground w-fit">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span>{dailyApplyStreak} day streak</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-1 scrollbar-thin">
          <div className="min-w-[560px] rounded-xl border border-border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-medium text-muted-foreground">Last 35 days</p>
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
                  title={`${day.label}: ${day.count} ${day.count === 1 ? "activity" : "activities"}`}
                  className={`h-4 w-4 rounded-[4px] ring-1 ring-slate-900/5 ${streakCellClass(day.count)}`}
                  aria-label={`${day.label}: ${day.count} activities`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
