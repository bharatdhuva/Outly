import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  scraped: { label: "Scraped", className: "bg-info/10 text-info border-info/20" },
  mail_generated: { label: "Generated", className: "bg-accent text-accent-foreground border-border" },
  approved: { label: "Approved", className: "bg-primary/10 text-primary border-primary/20" },
  mail_sent: { label: "Sent", className: "bg-success/10 text-success border-success/20" },
  replied: { label: "Replied", className: "bg-success/15 text-success border-success/30" },
  bounced: { label: "Bounced", className: "bg-destructive/10 text-destructive border-destructive/20" },
  skipped: { label: "Skipped", className: "bg-muted text-muted-foreground border-border" },
  applied: { label: "Applied", className: "bg-success/10 text-success border-success/20" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
  draft: { label: "Draft", className: "bg-accent text-accent-foreground border-border" },
  posted: { label: "Posted", className: "bg-success/10 text-success border-success/20" },
  captcha_blocked: { label: "CAPTCHA", className: "bg-warning/10 text-warning border-warning/20" },
  sent: { label: "Sent", className: "bg-success/10 text-success border-success/20" },
  error: { label: "Error", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium", config.className, className)}>
      {config.label}
    </span>
  );
}
