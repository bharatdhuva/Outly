import { useEffect, useState } from "react";
import { Mail, Briefcase, Clock, Zap } from "lucide-react";

interface QueueStatusBarProps {
  mailPending?: number;
  applyProcessing?: number;
  nextCron?: string;
}

export function QueueStatusBar({
  mailPending = 0,
  applyProcessing = 0,
  nextCron = "Not scheduled",
}: QueueStatusBarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const istTime = time
    .toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
      {/* Queue indicators */}
      <div className="flex items-center gap-2">
        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Mail Queue:</span>
        <span
          className={`font-mono text-xs font-semibold ${
            mailPending > 0 ? "text-warning" : "text-muted-foreground"
          }`}
        >
          {mailPending} pending
        </span>
        {mailPending > 0 && (
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
        )}
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Apply Queue:</span>
        <span
          className={`font-mono text-xs font-semibold ${
            applyProcessing > 0 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {applyProcessing > 0 ? `${applyProcessing} applying` : "idle"}
        </span>
        {applyProcessing > 0 && (
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        )}
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Next post:</span>
        <span className="font-mono text-xs text-foreground">{nextCron}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-xs text-muted-foreground">{istTime} IST</span>
      </div>
    </div>
  );
}
