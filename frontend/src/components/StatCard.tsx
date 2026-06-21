import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { MiniChart } from "@/components/MiniChart";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  variant?: "default" | "primary" | "success" | "warning";
  sparkline?: { value: number }[];
}

const variantStyles = {
  default: "border-border",
  primary: "border-primary/25",
  success: "border-success/25",
  warning: "border-warning/25",
};

const iconVariantStyles = {
  default: "bg-accent text-accent-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

const sparklineColors = {
  default: "hsl(220, 13%, 46%)",
  primary: "hsl(245, 78%, 58%)",
  success: "hsl(158, 64%, 40%)",
  warning: "hsl(35, 92%, 50%)",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  sparkline,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] transition-colors duration-200 hover:border-primary/30",
        variantStyles[variant],
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-[12px] font-medium text-muted-foreground">
            {title}
          </p>
          <p className="animate-count-up text-2xl font-semibold tracking-tight text-card-foreground">
            {value}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p
              className={cn(
                "mt-1 text-[12px] font-semibold",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            iconVariantStyles[variant]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Sparkline mini chart */}
      {sparkline && sparkline.length > 0 && (
        <div className="mt-3 -mx-1">
          <MiniChart
            data={sparkline}
            color={sparklineColors[variant]}
            height={36}
          />
        </div>
      )}
    </div>
  );
}
