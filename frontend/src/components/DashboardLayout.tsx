import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { CheckCircle, Menu, Search } from "lucide-react";
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

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/cold-mail": "Cold Mail",
  "/linkedin-posts": "LinkedIn Posts",
  "/twitter": "Twitter / X",
  "/reddit": "Reddit",
  "/telegram": "Telegram",
  "/settings": "Settings",
  "/logs": "Logs",
  "/resume-tailor": "Resume Tailor",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const systemPills = useSystemStatus();
  const allOk = systemPills.every((p) => p.ok);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pageTitle = pageTitles[location.pathname] ?? "Page Not Found";

  useEffect(() => {
    document.title = `${pageTitle} | Outly`;
  }, [pageTitle]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-h-screen flex-col md:ml-[260px]">
        <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-[64px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:text-foreground md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-5 text-muted-foreground">Outly workspace</p>
                <h1 className="truncate text-[15px] font-semibold leading-5 text-foreground">{pageTitle}</h1>
              </div>
            </div>

            <div className="hidden w-full max-w-md items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-muted-foreground lg:flex">
              <Search className="h-4 w-4" />
              <span className="text-[13px]">Search workflows, logs, and settings</span>
            </div>

            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium ${
                allOk
                  ? "border-success/20 bg-success/10 text-success"
                  : "border-warning/25 bg-warning/10 text-warning"
              }`}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {allOk ? "Healthy" : "Review"}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2 sm:px-6 lg:px-8">
            {systemPills.map((pill) => (
              <div
                key={pill.label}
                className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-[12px] text-muted-foreground shadow-sm"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${pill.ok ? "bg-success" : "bg-destructive"}`} />
                {pill.label}
              </div>
            ))}
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1360px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
