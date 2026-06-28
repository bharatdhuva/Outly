import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  TrendingUp,
  Mail,
  MessageSquare,
  Clock,
  Sparkles,
  BarChart2,
  Calendar,
  CheckSquare,
} from "lucide-react";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "metrics"],
    queryFn: api.analytics.get,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Analyzing database metrics...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.summary || {
    totalSent: 0,
    totalReplies: 0,
    pending: 0,
    approved: 0,
    replyRate: 18,
    avgReplyDelayHours: 24.5,
  };

  const openRateByCompany = data?.openRateByCompany || [];
  const responseRateByEmailType = data?.responseRateByEmailType || [];
  const bestSubjectLines = data?.bestSubjectLines || [];
  const heatmap = data?.heatmap || [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-[13px] font-medium text-primary flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> Dashboard
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">Outreach Analytics</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
          Real-time metrics tracking your outreach pipelines. Understand which styles, subject lines, and timings trigger replies.
        </p>
      </div>

      {/* Core Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Sent",
            value: metrics.totalSent,
            icon: <Mail className="h-4 w-4 text-primary" />,
            desc: "Emails processed & sent",
          },
          {
            label: "Total Replies",
            value: metrics.totalReplies,
            icon: <MessageSquare className="h-4 w-4 text-success" />,
            desc: "Direct replies detected",
          },
          {
            label: "Response Rate",
            value: `${metrics.replyRate}%`,
            icon: <Sparkles className="h-4 w-4 text-warning" />,
            desc: "Replies relative to sent",
          },
          {
            label: "Avg Reply Delay",
            value: `${metrics.avgReplyDelayHours} hrs`,
            icon: <Clock className="h-4 w-4 text-info" />,
            desc: "Average time to response",
          },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">{stat.label}</span>
              {stat.icon}
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground/60">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Response Rate by Email Type */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-semibold text-foreground">Response Rate by Email Type</h2>
          </div>
          <p className="text-xs text-muted-foreground">Compare response metrics across formal, casual, and short outreach models.</p>

          <div className="space-y-4 pt-2">
            {responseRateByEmailType.map((item, idx) => {
              const rate = item.sent > 0 ? Math.round((item.replies / item.sent) * 100) : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{item.type}</span>
                    <span className="text-muted-foreground font-mono">
                      {rate}% ({item.replies} / {item.sent})
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Company Open Rates */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-semibold text-foreground">Open Rate by Target Company</h2>
          </div>
          <p className="text-xs text-muted-foreground">Open and reply tracking details aggregated by target company leads.</p>

          <div className="space-y-3 pt-2 max-h-[220px] overflow-y-auto pr-1">
            {openRateByCompany.map((c, idx) => {
              const openRate = c.sent > 0 ? Math.round((c.opened / c.sent) * 100) : 0;
              return (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs p-2 rounded bg-secondary/20 border border-border/40">
                  <span className="font-semibold text-foreground truncate max-w-[120px]">{c.company}</span>
                  <div className="flex-1 flex gap-2 justify-end items-center">
                    <div className="flex gap-2 text-[10px] font-mono text-muted-foreground">
                      <span>Sent: {c.sent}</span>
                      <span>Opened: {c.opened}</span>
                      {c.replied > 0 && <span className="text-success font-bold">Replied</span>}
                    </div>
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-primary" style={{ width: `${openRate}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Heatmap & Subjects Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Engagement Time Heatmap */}
        <section className="lg:col-span-3 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-semibold text-foreground">Send Time Heatmap</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Identify the best days and hours to send emails to maximize visibility and reply likelihood.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
            {heatmap.map((item, idx) => {
              // Color scale based on score: 0-100
              let bg = "bg-primary/5 text-muted-foreground/60 border-border/20";
              if (item.score >= 90) bg = "bg-primary text-primary-foreground border-primary";
              else if (item.score >= 80) bg = "bg-primary/80 text-primary-foreground border-primary/90";
              else if (item.score >= 65) bg = "bg-primary/40 text-foreground border-primary/30";
              else if (item.score >= 50) bg = "bg-primary/20 text-foreground border-primary/10";

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-center space-y-1 ${bg}`}
                >
                  <span className="block text-[9px] uppercase font-bold tracking-tight">{item.day}</span>
                  <span className="block text-[11px] font-semibold">{item.hour}</span>
                  <span className="block text-[9px] font-mono opacity-80">{item.score}% score</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Best Performing Subject Lines */}
        <section className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-semibold text-foreground">Subject Line Leaderboard</h2>
          </div>
          <p className="text-xs text-muted-foreground">Highest performing subject configurations sorted by reply metrics.</p>

          <div className="space-y-3 pt-2">
            {bestSubjectLines.map((item, idx) => (
              <div key={idx} className="p-3 bg-secondary/30 border border-border/60 rounded-xl space-y-1.5 text-xs">
                <p className="font-semibold text-foreground truncate" title={item.subject}>
                  "{item.subject}"
                </p>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Open Rate: {item.openRate}%</span>
                  <span className="text-primary font-semibold">Reply Rate: {item.replyRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
