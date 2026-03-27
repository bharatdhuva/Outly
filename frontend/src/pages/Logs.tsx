import { useState, useEffect, useRef } from "react";
import { Download, Search, X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LogLevel = "info" | "success" | "warn" | "error";

interface LogEntry {
  time: string;
  level: LogLevel;
  source: string;
  message: string;
}

const initialLogs: LogEntry[] = [
  { time: "16:22:05", level: "success", source: "mail", message: "Cold mail sent to hr@razorpay.com — Subject: Re: Razorpay's engineering team" },
  { time: "16:21:42", level: "info", source: "mail", message: "Processing mail queue job #47 for Razorpay" },
  { time: "16:18:18", level: "success", source: "linkedin", message: "Applied to Frontend Intern @ Zepto — Easy Apply submitted" },
  { time: "16:17:55", level: "info", source: "linkedin", message: "Filling application form for Zepto — step 2/3" },
  { time: "16:17:30", level: "info", source: "linkedin", message: "Generated cover letter for Zepto SDE Intern position" },
  { time: "16:15:02", level: "success", source: "whatsapp", message: "Notification sent: ✅ Applied to SDE Intern @ Meesho" },
  { time: "16:12:17", level: "warn", source: "mail", message: "Mail to careers@xyz.corp bounced — invalid recipient address" },
  { time: "16:10:44", level: "info", source: "scraper", message: "Scraped company context for PhonePe — tech stack: React, Go, Kubernetes" },
  { time: "16:08:33", level: "error", source: "linkedin", message: "CAPTCHA detected on LinkedIn — apply queue paused automatically" },
  { time: "16:05:01", level: "success", source: "whatsapp", message: "Notification sent: ⚠️ CAPTCHA detected — check dashboard" },
  { time: "16:02:22", level: "info", source: "system", message: "Daily summary cron triggered — compiling stats" },
  { time: "16:00:05", level: "success", source: "linkedin", message: "LinkedIn weekly post published — 'This Week in Tech' edition" },
  { time: "15:58:44", level: "info", source: "news", message: "Fetched 23 articles from HN, Dev.to, GitHub Trending" },
  { time: "15:55:11", level: "warn", source: "system", message: "Redis connection latency: 120ms (threshold: 100ms)" },
  { time: "15:52:00", level: "info", source: "mail", message: "Mail queue started — 5 approved mails pending" },
  { time: "15:50:00", level: "info", source: "system", message: "Outly started — all services initialized" },
];

const levelConfig: Record<LogLevel, { icon: React.ElementType; bg: string; text: string; pill: string }> = {
  info: { icon: Info, bg: "", text: "text-muted-foreground", pill: "bg-muted/50 text-muted-foreground border-border" },
  success: { icon: CheckCircle, bg: "", text: "text-success", pill: "bg-success/10 text-success border-success/20" },
  warn: { icon: AlertTriangle, bg: "bg-warning/5", text: "text-warning", pill: "bg-warning/10 text-warning border-warning/20" },
  error: { icon: AlertCircle, bg: "bg-destructive/5", text: "text-destructive", pill: "bg-destructive/10 text-destructive border-destructive/20" },
};

const levelLabel: Record<LogLevel, string> = {
  info: "INFO",
  success: "OK",
  warn: "WARN",
  error: "ERROR",
};

type FilterTab = "all" | "error" | "mail" | "linkedin" | "whatsapp";

export default function LogsPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulate new log entries streaming in
  useEffect(() => {
    const newLogs: LogEntry[] = [
      { time: "16:22:30", level: "info", source: "mail", message: "Waiting 4m 12s before next mail send" },
      { time: "16:22:50", level: "success", source: "scraper", message: "Scraped Zepto company page — 3 recent blog posts found" },
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < newLogs.length) {
        setLogs((prev) => [newLogs[i], ...prev]);
        i++;
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const filtered = logs.filter((log) => {
    if (filter === "error" && log.level !== "error" && log.level !== "warn") return false;
    if (filter === "mail" && log.source !== "mail") return false;
    if (filter === "linkedin" && log.source !== "linkedin") return false;
    if (filter === "whatsapp" && log.source !== "whatsapp") return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const logStats = {
    total: logs.length,
    errors: logs.filter((l) => l.level === "error").length,
    warns: logs.filter((l) => l.level === "warn").length,
    success: logs.filter((l) => l.level === "success").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Logs</h1>
          <p className="text-sm text-muted-foreground">Real-time system activity stream</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => setLogs([])}
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
        </div>
      </div>

      {/* Log Stats */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total", value: logStats.total, color: "text-foreground" },
          { label: "Errors", value: logStats.errors, color: "text-destructive" },
          { label: "Warnings", value: logStats.warns, color: "text-warning" },
          { label: "Success", value: logStats.success, color: "text-success" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center rounded-xl border border-border bg-card py-3"
          >
            <span className={`font-mono text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {(["all", "error", "mail", "linkedin", "whatsapp"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === t ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "error" ? "Errors" : t}
            </button>
          ))}
        </div>
        <div className="relative w-full xl:max-w-xs xl:flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="pl-9 h-8 bg-card border-border text-xs"
          />
        </div>
        <div className="flex items-center gap-2 xl:ml-auto">
          <span className="text-xs text-muted-foreground">Auto-scroll</span>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              autoScroll ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                autoScroll ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Log Stream */}
      <div className="rounded-xl border border-border bg-card font-mono text-xs overflow-hidden">
        <div ref={scrollRef} className="max-h-[560px] overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              No log entries match your filter.
            </div>
          ) : (
            filtered.map((log, i) => {
              const config = levelConfig[log.level];
              const Icon = config.icon;
              return (
                <div
                  key={i}
                  className={`flex flex-col gap-2 border-b border-border/50 px-4 py-2.5 transition-colors hover:bg-accent/20 sm:flex-row sm:items-start sm:gap-3 ${config.bg} ${
                    i === 0 ? "log-new" : ""
                  }`}
                >
                  <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${config.text}`} />
                  <span className="shrink-0 tabular-nums text-muted-foreground">{log.time}</span>
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${config.pill}`}
                  >
                    {levelLabel[log.level]}
                  </span>
                  <span className="shrink-0 text-muted-foreground/70 sm:w-[72px]">[{log.source}]</span>
                  <span className="text-foreground leading-relaxed">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
        <div className="flex flex-col gap-2 border-t border-border px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground/60 text-[10px]">{filtered.length} entries shown</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="text-muted-foreground text-[10px]">Streaming live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
