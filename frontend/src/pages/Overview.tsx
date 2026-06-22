import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  Flame,
  Mail,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useState } from "react";

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

  // ─── Streak data computation (91 days = ~13 weeks) ───
  const TOTAL_DAYS = 91;
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

  // Build the grid: we need full weeks (columns), starting from the nearest Sunday
  const today = new Date();
  const todayDayOfWeek = today.getDay(); // 0=Sun ... 6=Sat
  // End date is today
  // Start date: go back TOTAL_DAYS, then align to the previous Sunday
  const rawStart = new Date(today);
  rawStart.setDate(rawStart.getDate() - TOTAL_DAYS + 1);
  const startDayOfWeek = rawStart.getDay();
  rawStart.setDate(rawStart.getDate() - startDayOfWeek); // align to Sunday

  const gridDays: { key: string; count: number; date: Date; dayOfWeek: number; isToday: boolean; isFuture: boolean }[] = [];
  const iterDate = new Date(rawStart);
  while (iterDate <= today || iterDate.getDay() !== 0) {
    if (iterDate > today && iterDate.getDay() === 0 && gridDays.length > 0) break;
    const key = iterDate.toISOString().slice(0, 10);
    const isFuture = iterDate > today;
    gridDays.push({
      key,
      count: isFuture ? -1 : (activityByDay.get(key) ?? 0),
      date: new Date(iterDate),
      dayOfWeek: iterDate.getDay(),
      isToday: key === todayKey,
      isFuture,
    });
    iterDate.setDate(iterDate.getDate() + 1);
  }

  // Group into weeks (columns)
  const weeks: typeof gridDays[] = [];
  for (let i = 0; i < gridDays.length; i += 7) {
    weeks.push(gridDays.slice(i, i + 7));
  }

  // Month labels for top row
  const monthLabels: { label: string; colStart: number; colSpan: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wIdx) => {
    // Use the first non-future day of the week to determine month
    const refDay = week.find((d) => !d.isFuture) ?? week[0];
    const m = refDay.date.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        label: refDay.date.toLocaleDateString("en-US", { month: "short" }),
        colStart: wIdx,
        colSpan: 1,
      });
      lastMonth = m;
    } else if (monthLabels.length > 0) {
      monthLabels[monthLabels.length - 1].colSpan += 1;
    }
  });

  // Streak calculations
  const validDays = gridDays.filter((d) => !d.isFuture);

  // Current streak (from today backwards)
  let currentStreak = 0;
  for (let i = validDays.length - 1; i >= 0; i--) {
    if (validDays[i].count === 0) break;
    currentStreak++;
  }

  // Max streak
  let maxStreak = 0;
  let tempStreak = 0;
  for (const day of validDays) {
    if (day.count > 0) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Total activities & active days
  let totalActivities = 0;
  let activeDays = 0;
  for (const day of validDays) {
    totalActivities += day.count;
    if (day.count > 0) activeDays++;
  }

  const streakCellColor = (count: number) => {
    if (count === -1) return "streak-cell--empty";
    if (count >= 8) return "streak-cell--l4";
    if (count >= 5) return "streak-cell--l3";
    if (count >= 3) return "streak-cell--l2";
    if (count >= 1) return "streak-cell--l1";
    return "streak-cell--l0";
  };

  // Tooltip state
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const handleCellMouseEnter = (e: React.MouseEvent, day: typeof gridDays[0]) => {
    if (day.isFuture) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const label = day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    const text = day.count === 0
      ? `No activity on ${label}`
      : `${day.count} ${day.count === 1 ? "activity" : "activities"} on ${label}`;
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, text });
  };

  const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

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

      {/* 4. Daily Apply Streak — GitHub + LeetCode Style */}
      <section className="streak-section">
        <div className="streak-header">
          <div className="flex items-center gap-2.5">
            <div className="streak-header-icon">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Activity Streak</h2>
              <p className="text-[12px] text-muted-foreground">
                {totalActivities} activities in the last {TOTAL_DAYS} days
              </p>
            </div>
          </div>
        </div>

        {/* LeetCode-style Streak Stats */}
        <div className="streak-stats">
          <div className="streak-stat-card streak-stat-card--fire">
            <div className="streak-stat-icon streak-stat-icon--fire">
              <Flame className="h-5 w-5" />
            </div>
            <div className="streak-stat-content">
              <span className="streak-stat-value">{currentStreak}</span>
              <span className="streak-stat-label">Current Streak</span>
            </div>
          </div>

          <div className="streak-stat-card streak-stat-card--trophy">
            <div className="streak-stat-icon streak-stat-icon--trophy">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="streak-stat-content">
              <span className="streak-stat-value">{maxStreak}</span>
              <span className="streak-stat-label">Max Streak</span>
            </div>
          </div>

          <div className="streak-stat-card streak-stat-card--zap">
            <div className="streak-stat-icon streak-stat-icon--zap">
              <Zap className="h-5 w-5" />
            </div>
            <div className="streak-stat-content">
              <span className="streak-stat-value">{totalActivities}</span>
              <span className="streak-stat-label">Total Activities</span>
            </div>
          </div>

          <div className="streak-stat-card streak-stat-card--target">
            <div className="streak-stat-icon streak-stat-icon--target">
              <Target className="h-5 w-5" />
            </div>
            <div className="streak-stat-content">
              <span className="streak-stat-value">{activeDays}</span>
              <span className="streak-stat-label">Active Days</span>
            </div>
          </div>
        </div>

        {/* GitHub-style Contribution Graph */}
        <div className="streak-graph-wrapper">
          <div className="streak-graph-scroll">
            <div className="streak-graph">
              {/* Day labels (left column) */}
              <div className="streak-day-labels">
                <div className="streak-month-spacer" />
                {DAY_LABELS.map((label, i) => (
                  <div key={i} className="streak-day-label">{label}</div>
                ))}
              </div>

              {/* Grid of weeks */}
              <div className="streak-weeks">
                {/* Month labels row */}
                <div className="streak-month-row">
                  {monthLabels.map((ml, i) => (
                    <div
                      key={i}
                      className="streak-month-label"
                      style={{ gridColumn: `${ml.colStart + 1} / span ${ml.colSpan}` }}
                    >
                      {ml.label}
                    </div>
                  ))}
                </div>

                {/* Week columns with cells */}
                <div className="streak-grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
                  {weeks.map((week, wIdx) =>
                    week.map((day) => (
                      <div
                        key={day.key}
                        className={`streak-cell ${streakCellColor(day.count)} ${day.isToday ? "streak-cell--today" : ""}`}
                        onMouseEnter={(e) => handleCellMouseEnter(e, day)}
                        onMouseLeave={() => setTooltip(null)}
                        data-count={day.count}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="streak-legend">
            <span className="streak-legend-text">Less</span>
            <div className="streak-cell streak-cell--l0 streak-legend-cell" />
            <div className="streak-cell streak-cell--l1 streak-legend-cell" />
            <div className="streak-cell streak-cell--l2 streak-legend-cell" />
            <div className="streak-cell streak-cell--l3 streak-legend-cell" />
            <div className="streak-cell streak-cell--l4 streak-legend-cell" />
            <span className="streak-legend-text">More</span>
          </div>
        </div>

        {/* Floating tooltip */}
        {tooltip && (
          <div
            className="streak-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.text}
          </div>
        )}
      </section>
    </div>
  );
}


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
