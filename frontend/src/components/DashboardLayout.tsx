import { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import logoTransparent from "@/assets/brand/logo_transparent.png";
import {
  FileText,
  FolderOpen,
  BarChart,
  LayoutGrid,
  Mail,
  ScrollText,
  Settings as SettingsIcon,
  Twitter,
  TrendingUp,
  ChevronDown,
  Menu,
  X,
  LogOut
} from "lucide-react";

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
  "/analytics": "Analytics"
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Hover states for desktop dropdowns
  const [activeDropdown, setActiveDropdown] = useState<"resume" | "tools" | null>(null);

  // Fetch settings from API to personalize the dashboard profile
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });

  const pageTitle = pageTitles[location.pathname] ?? "Page Not Found";

  useEffect(() => {
    document.title = `Outly - ${pageTitle}`;
  }, [pageTitle]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const fullName = settings?.full_name || "Outly User";
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "OU";

  const handleLogout = () => {
    // Clear token if stored in cookies/localStorage, then navigate to login
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-outly-dark flex flex-col font-sans">
      
      {/* ─── TOP NAVIGATION HEADER (ENHANCV STYLE) ─── */}
      <header className="sticky top-0 z-40 w-full border-b border-[#e8e2d5] bg-white/95 backdrop-blur-md shadow-sm shrink-0 select-none">
        <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity">
              <img src={logoTransparent} alt="Outly Logo" className="w-8 h-8 object-contain" />
              <span className="font-serif font-medium text-outly-dark text-[18px]">Outly</span>
            </Link>

            {/* Middle: Desktop Links & Dropdowns */}
            <nav className="hidden md:flex items-center gap-6">
              
              {/* Dashboard Direct Link */}
              <Link 
                to="/dashboard" 
                className={`text-xs font-bold uppercase tracking-widest transition-colors duration-200 py-2 border-b-2 ${
                  location.pathname === "/dashboard" 
                    ? "border-outly-accent text-outly-accent" 
                    : "border-transparent text-outly-dark/60 hover:text-outly-dark"
                }`}
              >
                Overview
              </Link>

              {/* Resume Dropdown (Enhancv Mega Menu Style) */}
              <div 
                className="relative"
                onMouseEnter={() => setActiveDropdown("resume")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button 
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "resume" ? null : "resume")}
                  className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest py-2 border-b-2 transition-colors duration-200 ${
                    location.pathname.startsWith("/resume-") || location.pathname === "/ats-score"
                      ? "border-outly-accent text-outly-accent" 
                      : "border-transparent text-outly-dark/60 hover:text-outly-dark"
                  }`}
                >
                  <span>Resume</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${activeDropdown === "resume" ? "rotate-180 text-outly-accent" : ""}`} />
                </button>

                {/* Resume Dropdown Content (Two Column Mega Menu) */}
                {activeDropdown === "resume" && (
                  <div className="absolute left-0 top-[100%] w-[480px] bg-white border border-[#e8e2d5] rounded-2xl p-4 shadow-xl mt-1 animate-slide-up grid grid-cols-12 gap-5 z-50 select-none">
                    
                    {/* Left Column: Tools (7/12 width) */}
                    <div class="col-span-7 space-y-2">
                      <div className="text-[9px] font-extrabold text-outly-dark/30 uppercase tracking-widest mb-2 px-1">Tools</div>
                      <div className="space-y-1">
                        <Link 
                          to="/resume-tailor" 
                          className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-outly-cream/35 transition text-left"
                        >
                          <span className="text-base shrink-0">🛠️</span>
                          <div>
                            <span class="block text-[11.5px] font-bold text-outly-dark">AI Resume Builder</span>
                            <span className="block text-[10px] text-outly-dark/45 mt-0.5">Helps you to land interviews</span>
                          </div>
                        </Link>
                        <Link 
                          to="/ats-score" 
                          className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-outly-cream/35 transition text-left"
                        >
                          <span className="text-base shrink-0">📊</span>
                          <div>
                            <span class="block text-[11.5px] font-bold text-outly-dark">Resume Checker</span>
                            <span className="block text-[10px] text-outly-dark/45 mt-0.5">Is your resume good enough?</span>
                          </div>
                        </Link>
                        <Link 
                          to="/resume-vault" 
                          className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-outly-cream/35 transition text-left"
                        >
                          <span className="text-base shrink-0">📁</span>
                          <div>
                            <span class="block text-[11.5px] font-bold text-outly-dark">Resume Templates</span>
                            <span className="block text-[10px] text-outly-dark/45 mt-0.5">Free and premium templates</span>
                          </div>
                        </Link>
                        <Link 
                          to="/resume-vault" 
                          className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-outly-cream/35 transition text-left"
                        >
                          <span className="text-base shrink-0">💼</span>
                          <div>
                            <span class="block text-[11.5px] font-bold text-outly-dark">Resume Examples</span>
                            <span className="block text-[10px] text-outly-dark/45 mt-0.5">Generate or explore CVs</span>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Right Column: Learning Guides (5/12 width) */}
                    <div class="col-span-5 border-l border-outly-border/50 pl-4 space-y-2">
                      <div className="text-[9px] font-extrabold text-outly-dark/30 uppercase tracking-widest mb-2">Learning</div>
                      <div className="space-y-3.5 pt-1.5">
                        <a href="#" className="block text-[11px] font-bold text-outly-dark/75 hover:text-outly-accent transition">How to write a resume</a>
                        <a href="#" className="block text-[11px] font-bold text-outly-dark/75 hover:text-outly-accent transition">Choosing a resume format</a>
                        <a href="#" className="block text-[11px] font-bold text-outly-dark/75 hover:text-outly-accent transition">Writing a resume summary</a>
                        <a href="#" className="block text-[11px] font-bold text-outly-dark/75 hover:text-outly-accent transition">Fit your experience on one page</a>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Tools Dropdown (Enhancv Mega Menu Style) */}
              <div 
                className="relative"
                onMouseEnter={() => setActiveDropdown("tools")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button 
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "tools" ? null : "tools")}
                  className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest py-2 border-b-2 transition-colors duration-200 ${
                    ["/ats-score", "/applications", "/cold-mail", "/linkedin-posts", "/twitter", "/analytics"].some(path => location.pathname.startsWith(path))
                      ? "border-outly-accent text-outly-accent" 
                      : "border-transparent text-outly-dark/60 hover:text-outly-dark"
                  }`}
                >
                  <span>Tools</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${activeDropdown === "tools" ? "rotate-180 text-outly-accent" : ""}`} />
                </button>

                {/* Tools Dropdown Content (Two Column Mega Menu) */}
                {activeDropdown === "tools" && (
                  <div className="absolute left-0 top-[100%] w-[480px] bg-white border border-[#e8e2d5] rounded-2xl p-4 shadow-xl mt-1 animate-slide-up grid grid-cols-2 gap-5 z-50 select-none">
                    
                    {/* Left Column: Evaluation & Tracking */}
                    <div className="space-y-2">
                      <div className="text-[9px] font-extrabold text-outly-dark/30 uppercase tracking-widest mb-2 px-1">Evaluation &amp; Tracking</div>
                      <div className="space-y-1">
                        <Link 
                          to="/ats-score" 
                          className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-outly-cream/35 transition text-left"
                        >
                          <span className="text-base shrink-0">📊</span>
                          <div>
                            <span class="block text-[11.5px] font-bold text-outly-dark">ATS Score Checker</span>
                            <span className="block text-[10px] text-outly-dark/45 mt-0.5">Evaluate resume match</span>
                          </div>
                        </Link>
                        <Link 
                          to="/applications" 
                          className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-outly-cream/35 transition text-left"
                        >
                          <span className="text-base shrink-0">📅</span>
                          <div>
                            <span class="block text-[11.5px] font-bold text-outly-dark">Job Tracker</span>
                            <span className="block text-[10px] text-outly-dark/45 mt-0.5">Kanban pipeline pipelines</span>
                          </div>
                        </Link>
                        <Link 
                          to="/analytics" 
                          className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-outly-cream/35 transition text-left"
                        >
                          <span className="text-base shrink-0">📈</span>
                          <div>
                            <span class="block text-[11.5px] font-bold text-outly-dark">Analytics</span>
                            <span className="block text-[10px] text-outly-dark/45 mt-0.5">Outreach campaign metrics</span>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Right Column: Campaign Outreach */}
                    <div className="space-y-2 border-l border-outly-border/50 pl-4">
                      <div className="text-[9px] font-extrabold text-outly-dark/30 uppercase tracking-widest mb-2 px-1">Campaign Outreach</div>
                      <div className="space-y-1">
                        <Link 
                          to="/cold-mail" 
                          className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-outly-cream/35 transition text-left"
                        >
                          <span className="text-base shrink-0">✉️</span>
                          <div>
                            <span class="block text-[11.5px] font-bold text-outly-dark">Cold Mail</span>
                            <span className="block text-[10px] text-outly-dark/45 mt-0.5">Personalized email sender</span>
                          </div>
                        </Link>
                        <Link 
                          to="/linkedin-posts" 
                          className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-outly-cream/35 transition text-left"
                        >
                          <span className="text-base shrink-0">📝</span>
                          <div>
                            <span class="block text-[11.5px] font-bold text-outly-dark">LinkedIn Posts</span>
                            <span className="block text-[10px] text-outly-dark/45 mt-0.5">Brand builder automation</span>
                          </div>
                        </Link>
                        <Link 
                          to="/twitter" 
                          className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-outly-cream/35 transition text-left"
                        >
                          <span className="text-base shrink-0">🐦</span>
                          <div>
                            <span class="block text-[11.5px] font-bold text-outly-dark">Twitter / X</span>
                            <span className="block text-[10px] text-outly-dark/45 mt-0.5">Schedule automated tweets</span>
                          </div>
                        </Link>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Logs Direct Link */}
              <Link 
                to="/logs" 
                className={`text-xs font-bold uppercase tracking-widest transition-colors duration-200 py-2 border-b-2 ${
                  location.pathname === "/logs" 
                    ? "border-outly-accent text-outly-accent" 
                    : "border-transparent text-outly-dark/60 hover:text-outly-dark"
                }`}
              >
                System Logs
              </Link>

              {/* Settings Direct Link */}
              <Link 
                to="/settings" 
                className={`text-xs font-bold uppercase tracking-widest transition-colors duration-200 py-2 border-b-2 ${
                  location.pathname === "/settings" 
                    ? "border-outly-accent text-outly-accent" 
                    : "border-transparent text-outly-dark/60 hover:text-outly-dark"
                }`}
              >
                Settings
              </Link>
            </nav>
          </div>

          {/* Right Side: Profile initials & Logout CTA */}
          <div className="flex items-center gap-4">
            
            {/* Desktop Profile Info */}
            <div className="hidden md:flex items-center gap-2.5 select-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-outly-accent text-[11px] font-bold text-white shadow-sm border border-outly-accent/20">
                {initials}
              </div>
              <span className="text-[12px] font-bold text-outly-dark max-w-[100px] truncate">{fullName}</span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              type="button"
              className="hidden md:inline-flex items-center justify-center rounded-xl border border-[#e8e2d5] bg-white text-[11px] font-bold tracking-widest uppercase py-2 px-4 shadow-sm text-outly-dark/60 hover:text-outly-dark hover:bg-outly-cream/25 active:scale-95 transition duration-200 gap-1.5"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e8e2d5] bg-white text-outly-dark/70 hover:text-outly-dark md:hidden shadow-sm"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

        </div>

        {/* ─── MOBILE RESPONSIVE NAVIGATION DRAWER ─── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#e8e2d5] bg-white px-4 py-6 space-y-5 animate-slide-up shadow-inner select-none">
            
            <div className="flex items-center gap-3 border-b border-[#e8e2d5] pb-4 select-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-outly-accent text-xs font-bold text-white">
                {initials}
              </div>
              <div>
                <p className="font-bold text-sm text-outly-dark leading-none">{fullName}</p>
                <p className="text-[10px] text-outly-dark/40 mt-1">Workspace Session Active</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-outly-dark/30 mb-2 px-1">Resume Suite</span>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/resume-vault" className="flex items-center gap-2 rounded-xl bg-outly-cream/10 border border-[#e8e2d5]/65 p-2 text-xs font-bold hover:bg-outly-cream/30">
                    <FolderOpen className="h-3.5 w-3.5 text-outly-accent" />
                    <span>Vault</span>
                  </Link>
                  <Link to="/resume-tailor" className="flex items-center gap-2 rounded-xl bg-outly-cream/10 border border-[#e8e2d5]/65 p-2 text-xs font-bold hover:bg-outly-cream/30">
                    <FileText className="h-3.5 w-3.5 text-outly-accent" />
                    <span>Tailor</span>
                  </Link>
                </div>
              </div>

              <div>
                <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-outly-dark/30 mb-2 px-1">Tools &amp; Evaluators</span>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/ats-score" className="flex items-center gap-2 rounded-xl bg-outly-cream/10 border border-[#e8e2d5]/65 p-2 text-xs font-bold hover:bg-outly-cream/30">
                    <BarChart className="h-3.5 w-3.5 text-outly-accent" />
                    <span>ATS Score</span>
                  </Link>
                  <Link to="/applications" className="flex items-center gap-2 rounded-xl bg-outly-cream/10 border border-[#e8e2d5]/65 p-2 text-xs font-bold hover:bg-outly-cream/30">
                    <LayoutGrid className="h-3.5 w-3.5 text-outly-accent" />
                    <span>Tracker</span>
                  </Link>
                  <Link to="/cold-mail" className="flex items-center gap-2 rounded-xl bg-outly-cream/10 border border-[#e8e2d5]/65 p-2 text-xs font-bold hover:bg-outly-cream/30">
                    <Mail className="h-3.5 w-3.5 text-outly-accent" />
                    <span>Cold Mail</span>
                  </Link>
                  <Link to="/linkedin-posts" className="flex items-center gap-2 rounded-xl bg-outly-cream/10 border border-[#e8e2d5]/65 p-2 text-xs font-bold hover:bg-outly-cream/30">
                    <FileText className="h-3.5 w-3.5 text-outly-accent" />
                    <span>LinkedIn</span>
                  </Link>
                  <Link to="/twitter" className="flex items-center gap-2 rounded-xl bg-outly-cream/10 border border-[#e8e2d5]/65 p-2 text-xs font-bold hover:bg-outly-cream/30">
                    <Twitter className="h-3.5 w-3.5 text-outly-accent" />
                    <span>Twitter</span>
                  </Link>
                  <Link to="/analytics" className="flex items-center gap-2 rounded-xl bg-outly-cream/10 border border-[#e8e2d5]/65 p-2 text-xs font-bold hover:bg-outly-cream/30">
                    <TrendingUp className="h-3.5 w-3.5 text-outly-accent" />
                    <span>Analytics</span>
                  </Link>
                </div>
              </div>

              <div>
                <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-outly-dark/30 mb-2 px-1">System &amp; Settings</span>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/logs" className="flex items-center gap-2 rounded-xl bg-outly-cream/10 border border-[#e8e2d5]/65 p-2 text-xs font-bold hover:bg-outly-cream/30">
                    <ScrollText className="h-3.5 w-3.5 text-outly-accent" />
                    <span>Logs</span>
                  </Link>
                  <Link to="/settings" className="flex items-center gap-2 rounded-xl bg-outly-cream/10 border border-[#e8e2d5]/65 p-2 text-xs font-bold hover:bg-outly-cream/30">
                    <SettingsIcon className="h-3.5 w-3.5 text-outly-accent" />
                    <span>Settings</span>
                  </Link>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              type="button"
              className="w-full flex items-center justify-center rounded-xl bg-outly-dark text-white text-xs font-bold py-3 uppercase tracking-wider hover:bg-outly-dark/90 active:scale-[0.98] transition gap-2"
            >
              <LogOut className="h-4 w-4 text-outly-accent" />
              Sign Out from Outly
            </button>
          </div>
        )}
      </header>

      {/* ─── MAIN CONTENT LAYOUT (FULL WIDTH) ─── */}
      <main className="flex-1 w-full flex flex-col min-h-0 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </main>

    </div>
  );
}
