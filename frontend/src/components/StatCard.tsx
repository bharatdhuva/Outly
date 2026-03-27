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
  default: "border-border hover:border-border",
  primary: "border-primary/20 hover:border-primary/40",
  success: "border-success/20 hover:border-success/40",
  warning: "border-warning/20 hover:border-warning/40",
};

const iconVariantStyles = {
  default: "bg-accent text-accent-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

const glowStyles = {
  default: "",
  primary: "hover:shadow-[0_0_20px_hsl(24_95%_53%/0.1)]",
  success: "hover:shadow-[0_0_20px_hsl(142_71%_45%/0.1)]",
  warning: "hover:shadow-[0_0_20px_hsl(38_92%_50%/0.1)]",
};

const sparklineColors = {
  default: "hsl(228, 10%, 55%)",
  primary: "hsl(24, 95%, 53%)",
  success: "hsl(142, 71%, 45%)",
  warning: "hsl(38, 92%, 50%)",
};

const leftBorderStyles = {
  default: "",
  primary: "border-l-2 border-l-primary/50",
  success: "border-l-2 border-l-success/50",
  warning: "border-l-2 border-l-warning/50",
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
        "rounded-xl border bg-card p-5 transition-all duration-300",
        variantStyles[variant],
        glowStyles[variant],
        leftBorderStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="animate-count-up text-3xl font-bold tracking-tight text-card-foreground">
            {value}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            iconVariantStyles[variant]
          )}
        >
          <Icon className="h-5 w-5" />
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
