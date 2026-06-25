import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SearchBar } from "@/components/SearchBar";
import { Menu, Search } from "lucide-react";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/cold-mail": "Cold Mail",
  "/linkedin-posts": "LinkedIn Posts",
  "/twitter": "Twitter / X",
  "/settings": "Settings",
  "/logs": "Logs",
  "/resume-tailor": "Resume Tailor",
  "/ats-score": "ATS Score",
  "/applications": "Applications",
  "/resume-vault": "Resume Vault",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const pageTitle = pageTitles[location.pathname] ?? "Page Not Found";

  useEffect(() => {
    document.title = `Outly - ${pageTitle}`;
  }, [pageTitle]);

  useEffect(() => {
    setMobileNavOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

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

            {/* Inline Search Bar - Desktop */}
            <div className="hidden lg:block flex-1 max-w-md mx-4">
              <SearchBar />
            </div>

            {/* Mobile search toggle */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:text-foreground lg:hidden"
              aria-label="Toggle search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile search bar (slide down) */}
          {mobileSearchOpen && (
            <div className="border-t border-border px-4 py-2.5 lg:hidden animate-slide-up">
              <SearchBar />
            </div>
          )}
        </header>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1360px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

