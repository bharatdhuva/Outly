import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SearchPalette } from "@/components/SearchPalette";
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
  "/telegram": "Telegram",
  "/settings": "Settings",
  "/logs": "Logs",
  "/resume-tailor": "Resume Tailor",
  "/ats-score": "ATS Score",
  "/applications": "Applications",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const systemPills = useSystemStatus();
  const allOk = systemPills.every((p) => p.ok);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pageTitle = pageTitles[location.pathname] ?? "Page Not Found";

  useEffect(() => {
    document.title = `Outly - ${pageTitle}`;
  }, [pageTitle]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Global Ctrl+K trigger listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-h-screen flex-col md:ml-[260px] min-w-0 overflow-x-hidden">
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

            {/* Interactive Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden w-full max-w-md items-center justify-between gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-muted-foreground transition-all hover:border-primary/30 hover:bg-secondary/85 lg:flex cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-[13px]">Search workflows, logs, and settings...</span>
              </div>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-white px-1.5 font-mono text-[9px] font-medium text-muted-foreground/80 shadow-sm leading-none shrink-0">
                Ctrl K
              </kbd>
            </button>

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

      {/* Global Search Command Dialog Palette Overlay */}
      <SearchPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
