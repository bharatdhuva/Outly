import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Mail,
  FileText,
  Settings,
  ScrollText,
  Twitter,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import { api, type Company } from "@/lib/api";
import { BrandLogo } from "@/components/BrandLogo";

const navItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Cold Mail", url: "/cold-mail", icon: Mail },
  { title: "LinkedIn Posts", url: "/linkedin-posts", icon: FileText },
  { title: "Twitter / X", url: "/twitter", icon: Twitter },
  { title: "Reddit", url: "/reddit", icon: MessageSquare },
  { title: "Telegram", url: "/telegram", icon: Send },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Logs", url: "/logs", icon: ScrollText },
];

export function AppSidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const location = useLocation();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });
  const { data: stats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: api.dashboard.stats,
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["coldmail", "companies"],
    queryFn: api.coldmail.companies,
  });

  const fullName = settings?.full_name || "Outly User";
  const headline = settings?.linkedin_headline || "Career Autopilot";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "JU";
  const pendingColdMail = companies.filter((company: Company) => company.status === "pending").length;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[240px] flex-col border-r border-border bg-sidebar transition-transform duration-300 md:z-40 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4 md:px-5">
        <BrandLogo className="min-w-0" />
        <span className="ml-auto rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary">
          LIVE
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground md:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.url === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.url);

          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              onClick={onClose}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              }`}
              activeClassName=""
            >
              <item.icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-sidebar-foreground group-hover:text-foreground"
                }`}
              />
              <span className="flex-1">{item.title}</span>
              {item.url === "/cold-mail" && pendingColdMail > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary/20 px-1 font-mono text-[10px] font-semibold text-primary">
                  {pendingColdMail}
                </span>
              )}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(24_95%_53%/0.8)]" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Today's Stats Mini Row */}
      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
          Today
        </p>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col items-center rounded-lg border border-border bg-accent/40 py-2">
            <span className="font-mono text-base font-bold text-primary">{stats?.mailsToday ?? 0}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Mails</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {initials}
            <div className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-success status-dot-success" />
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium text-foreground">{fullName}</p>
            <p className="text-xs text-muted-foreground">{headline}</p>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
