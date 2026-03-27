import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { CheckCircle, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocation } from "react-router-dom";

function useSystemStatus() {
  const { data } = useQuery({
    queryKey: ["dashboard", "system"],
    queryFn: api.dashboard.systemStatus,
    refetchInterval: 30000,
    retry: false,
  });
  return [
    { label: "Redis", ok: data?.redis ?? false },
    { label: "Gmail", ok: data?.gmail ?? false },
    { label: "LinkedIn", ok: data?.linkedin ?? false },
    { label: "WhatsApp", ok: data?.whatsapp ?? false },
  ];
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const systemPills = useSystemStatus();
  const allOk = systemPills.every((p) => p.ok);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const pageTitles: Record<string, string> = {
      "/": "Overview",
      "/cold-mail": "Cold Mail",
      "/linkedin-posts": "LinkedIn Posts",
      "/twitter": "Twitter / X",
      "/reddit": "Reddit",
      "/telegram": "Telegram",
      "/settings": "Settings",
      "/logs": "Logs",
    };

    const pageTitle = pageTitles[location.pathname] ?? "Page Not Found";
    document.title = `${pageTitle} | Outly`;
  }, [location.pathname]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col md:ml-[240px]">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-2 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
          <div className="order-3 flex w-full flex-wrap items-center gap-2 md:order-2 md:w-auto">
            {systemPills.map((pill) => (
              <div
                key={pill.label}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1"
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    pill.ok ? "bg-success shadow-[0_0_6px_hsl(142_71%_45%/0.7)]" : "bg-destructive"
                  }`}
                />
                <span className="font-mono text-[10px] text-muted-foreground">{pill.label}</span>
              </div>
            ))}
          </div>
          <div
            className={`order-2 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium md:order-3 ${
              allOk
                ? "bg-success/10 text-success border border-success/20"
                : "bg-warning/10 text-warning border border-warning/20"
            }`}
          >
            <CheckCircle className="h-3 w-3" />
            {allOk ? "All Systems OK" : "Degraded"}
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-5 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
