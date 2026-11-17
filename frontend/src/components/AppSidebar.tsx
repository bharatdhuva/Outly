import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  LayoutDashboard,
  Mail,
  X,
  LayoutGrid,
  BarChart,
  TrendingUp,
  FolderOpen,
} from "lucide-react";
import { api, type Company } from "@/lib/api";
import { BrandLogo } from "@/components/BrandLogo";
import { m, AnimatePresence } from "motion/react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { dur, ease } from "@/lib/motion-tokens";

const navSections = [
  {
    label: "Workspace",
    items: [
      { title: "Overview", url: "/onboarding", icon: LayoutDashboard },
      { title: "Applications", url: "/applications", icon: LayoutGrid },
      { title: "Resume Vault", url: "/resume-vault", icon: FolderOpen },
      { title: "ATS Score", url: "/ats-score", icon: BarChart },
      { title: "Resume Tailor", url: "/resume-tailor", icon: FileText },
      { title: "Cold Mail", url: "/cold-mail", icon: Mail },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Analytics", url: "/analytics", icon: TrendingUp },
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
      <AnimatePresence>
        {mobileOpen && (
          <m.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.fast }}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-xs md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-outly-border bg-outly-cream transition-transform duration-200 md:z-40 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex min-h-[64px] items-center gap-3 border-b border-outly-border px-5">
          <BrandLogo className="min-w-0" to="/onboarding" />
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md border border-outly-border p-1.5 text-[#6B6760] transition-colors hover:text-[#1A1A1A] md:hidden cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 font-sans">
          {navSections.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-[#B0ADA9]">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = item.url === "/onboarding" ? location.pathname === "/onboarding" : location.pathname.startsWith(item.url);
                  return (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end={item.url === "/onboarding"}
                      onClick={onClose}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-[#6B6760] hover:bg-outly-border/40 hover:text-[#1A1A1A]"
                      }`}
                      activeClassName=""
                    >
                      <item.icon className={`h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105 ${isActive ? "text-primary" : "text-[#6B6760] group-hover:text-[#1A1A1A]"}`} />
                      <span className="flex-1">{item.title}</span>
                      {item.url === "/cold-mail" && pendingColdMail > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-white">
                          <AnimatedNumber value={pendingColdMail} />
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-outly-border p-4 font-sans">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-outly-border bg-outly-border/30 p-3">
              <span className="block text-[11px] font-medium text-[#6B6760]">Today</span>
              <span className="mt-1 block text-lg font-semibold text-[#1A1A1A]">
                <AnimatedNumber value={stats?.mailsToday ?? 0} />
              </span>
            </div>
            <div className="rounded-lg border border-outly-border bg-outly-border/30 p-3">
              <span className="block text-[11px] font-medium text-[#6B6760]">Pending</span>
              <span className="mt-1 block text-lg font-semibold text-[#1A1A1A]">
                <AnimatedNumber value={pendingColdMail} />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A1A] text-[12px] font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[#1A1A1A]">{fullName}</p>
              <p className="truncate text-[12px] text-[#6B6760]">{headline}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
