import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  LayoutDashboard,
  Mail,
  MessageSquare,
  ScrollText,
  Send,
  Settings,
  Twitter,
  X,
  LayoutGrid,
  BarChart,
  Edit,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { api, type Company } from "@/lib/api";
import { BrandLogo } from "@/components/BrandLogo";

const navSections = [
  {
    label: "Workspace",
    items: [
      { title: "Overview", url: "/", icon: LayoutDashboard },
      { title: "Applications", url: "/applications", icon: LayoutGrid },
      { title: "ATS Score", url: "/ats-score", icon: BarChart },
      { title: "Cover Letter", url: "/cover-letter", icon: Edit },
      { title: "LinkedIn Optimizer", url: "/linkedin-optimizer", icon: UserCheck },
      { title: "Resume Tailor", url: "/resume-tailor", icon: FileText },
      { title: "Cold Mail", url: "/cold-mail", icon: Mail },
    ],
  },
  {
    label: "Publishing",
    items: [
      { title: "LinkedIn Posts", url: "/linkedin-posts", icon: FileText },
      { title: "Twitter / X", url: "/twitter", icon: Twitter },
      { title: "Telegram", url: "/telegram", icon: Send },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Analytics", url: "/analytics", icon: TrendingUp },
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Logs", url: "/logs", icon: ScrollText },
    ],
  },
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
  const headline = settings?.linkedin_headline || "Career workspace";
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "OU";
  const pendingColdMail = companies.filter((company: Company) => company.status === "pending").length;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 md:z-40 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex min-h-[72px] items-center gap-3 border-b border-sidebar-border px-5">
          <BrandLogo className="min-w-0" />
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground md:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navSections.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
                  return (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end={item.url === "/"}
                      onClick={onClose}
                      className={`group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                      activeClassName=""
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="flex-1">{item.title}</span>
                      {item.url === "/cold-mail" && pendingColdMail > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                          {pendingColdMail}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-border bg-secondary p-3">
              <span className="block text-[11px] font-medium text-muted-foreground">Today</span>
              <span className="mt-1 block text-lg font-semibold text-foreground">{stats?.mailsToday ?? 0}</span>
            </div>
            <div className="rounded-md border border-border bg-secondary p-3">
              <span className="block text-[11px] font-medium text-muted-foreground">Pending</span>
              <span className="mt-1 block text-lg font-semibold text-foreground">{pendingColdMail}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground">{fullName}</p>
              <p className="truncate text-[12px] text-muted-foreground">{headline}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
