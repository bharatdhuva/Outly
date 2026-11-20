import { useEffect, useRef, useState, useMemo } from "react";
import { m, AnimatePresence } from "motion/react";
import { dur, ease } from "@/lib/motion-tokens";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ScrollText,
  Settings as SettingsIcon,
  ChevronDown,
  Menu,
  X,
  LogOut,
  KeyRound,
  Zap,
  CheckCircle2,
  Calendar,
  HelpCircle,
  Briefcase,
  Wrench,
  User,
  Search,
  Bell,
  Lock,
  Send,
  Box,
  FileText,
  BookOpen,
  LayoutTemplate,
  AlignLeft,
  Building2,
  Target,
  DollarSign,
  Share2,
  Mail,
  ArrowRight,
  Sparkles,
  Clock
} from "lucide-react";
import "./MegaNav.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
};

const popoverVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 450, damping: 32 } },
  exit: { opacity: 0, y: -4, scale: 0.96, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } },
};

interface MegaMenuItem {
  title: string;
  desc: string;
  href?: string;
  guideKey?: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  badge?: string;
}

interface MegaMenuGroup {
  heading: string;
  items: MegaMenuItem[];
}

interface MegaMenuConfig {
  key: "resumes" | "jobs" | "tools";
  label: string;
  groups: MegaMenuGroup[];
  footerLink?: {
    label: string;
    href?: string;
    guideKey?: string;
  };
}

const MEGA_MENUS: MegaMenuConfig[] = [
  {
    key: "resumes",
    label: "Resume",
    groups: [
      {
        heading: "Build & Improve",
        items: [
          {
            title: "ATS Resume Checker",
            desc: "Analyze score & algorithms",
            href: "/ats-score",
            icon: CheckCircle2,
          },
          {
            title: "Tailor Resume",
            desc: "Target job descriptions",
            href: "/resume-tailor",
            icon: Box,
          },
          {
            title: "Resume Vault",
            desc: "Saved resumes & versions",
            href: "/resume-vault",
            icon: FileText,
          },
        ],
      },
      {
        heading: "Resume Strategy",
        items: [
          {
            title: "How to write a resume",
            desc: "Impactful writing guide",
            guideKey: "how-to-write",
            icon: BookOpen,
          },
          {
            title: "Choosing a resume format",
            desc: "Pick the best structure",
            guideKey: "resume-format",
            icon: LayoutTemplate,
          },
        ],
      },
      {
        heading: "Formatting",
        items: [
          {
            title: "Writing a resume summary",
            desc: "Hook recruiters instantly",
            guideKey: "resume-summary",
            icon: AlignLeft,
          },
          {
            title: "Fit experience on one page",
            desc: "One-page format strategy",
            guideKey: "one-page",
            icon: FileText,
          },
        ],
      },
    ],
    footerLink: {
      label: "How we score resumes",
      href: "/ats-score",
    },
  },
  {
    key: "jobs",
    label: "Jobs",
    groups: [
      {
        heading: "Find & Track",
        items: [
          {
            title: "Job Search",
            desc: "Find matches instantly",
            href: "/job-search",
            icon: Building2,
          },
          {
            title: "Job Tracker",
            desc: "Track on a visual board",
            href: "/applications",
            icon: Target,
          },
        ],
      },
      {
        heading: "Interview & Offer",
        items: [
          {
            title: "Job Interview Guides",
            desc: "Behavioral & tech guides",
            guideKey: "interview-prep",
            icon: HelpCircle,
          },
          {
            title: "Salary negotiation guide",
            desc: "Maximize your offer",
            guideKey: "salary-negotiation",
            icon: DollarSign,
          },
        ],
      },
      {
        heading: "Networking",
        items: [
          {
            title: "LinkedIn networking tactics",
            desc: "Unlock hidden roles",
            guideKey: "linkedin-networking",
            icon: Share2,
          },
          {
            title: "Job search sprint strategy",
            desc: "Weekly sprint workflow",
            guideKey: "sprint-strategy",
            icon: Zap,
          },
        ],
      },
    ],
    footerLink: {
      label: "Explore career playbooks",
      guideKey: "interview-prep",
    },
  },
  {
    key: "tools",
    label: "Tools",
    groups: [
      {
        heading: "AI Outreach",
        items: [
          {
            title: "Cold Mail Automation",
            desc: "Personalized recruiter emails",
            href: "/cold-mail",
            icon: Mail,
            badge: "AI",
          },
        ],
      },
    ],
    footerLink: {
      label: "How outreach automation works",
      href: "/cold-mail",
    },
  },
];

const pageTitles: Record<string, string> = {
  "/onboarding": "Overview",
  "/cold-mail": "Cold Mail",
  "/linkedin-posts": "LinkedIn Posts",
  "/twitter": "Twitter / X",
  "/settings": "Settings",
  "/logs": "Logs",
  "/resume-tailor": "Resume Tailor",
  "/ats-score": "ATS Score",
  "/applications": "Job Tracker",
  "/job-search": "Job Search",
  "/resume-vault": "Resume Vault",
  "/resumes": "Resume Workspace",
  "/jobs": "Job Workspace",
  "/tools": "Tools Workspace",
  "/analytics": "Analytics",
  "/pricing": "Pricing",
  "/support": "Support & Help"
};

function PlanStatusAvatar({
  profilePic,
  fullName,
  initials,
  sizeClass = "h-8 w-8 text-[11px]",
}: {
  profilePic?: string | null;
  fullName: string;
  initials: string;
  sizeClass?: string;
  isPremium?: boolean;
  innerBorderClass?: string;
  plainBorderClass?: string;
  showProBadge?: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [profilePic]);

  // If profilePic exists, is not the generic default placeholder, and hasn't errored
  const isDefaultPlaceholder =
    typeof profilePic === "string" && profilePic.includes("default-user=");
  const showImage = Boolean(profilePic && !isDefaultPlaceholder && !imgError);

  return (
    <div
      className={`relative ${sizeClass} rounded-full overflow-hidden shrink-0 select-none bg-neutral-200 flex items-center justify-center`}
    >
      {showImage ? (
        <img
          src={profilePic!}
          alt={fullName}
          referrerPolicy="no-referrer"
          className="h-full w-full rounded-full object-cover block"
          loading="eager"
          decoding="sync"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1A1A1A] text-white font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
}

function ProfileDropdownMenu({
  isPremium,
  profilePic,
  fullName,
  initials,
  userEmail,
  isDemo,
  onClose,
  onNavigate,
  onLogout,
  onLockedFeature
}: {
  isPremium: boolean;
  profilePic?: string | null;
  fullName: string;
  initials: string;
  userEmail: string;
  isDemo: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onLockedFeature: (feature: string) => void;
}) {
  return (
    <m.div
      variants={popoverVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ transformOrigin: "top right", backgroundColor: "#ffffff" }}
      className="absolute right-0 top-full mt-2 w-[240px] sm:w-[264px] rounded-2xl bg-white border border-neutral-200/90 font-sans shadow-[0_16px_36px_-6px_rgba(20,25,30,0.18),0_2px_6px_rgba(0,0,0,0.06)] z-[150] p-1.5 sm:p-2 overflow-hidden select-none"
    >
      {/* ─── USER PROFILE CARD HEADER ─── */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-[#FAF9F5] border border-black/[0.04]">
        <div className="flex items-center gap-2.5">
          <PlanStatusAvatar
            isPremium={isPremium}
            profilePic={profilePic}
            fullName={fullName}
            initials={initials}
            sizeClass="h-8 w-8 sm:h-9 sm:w-9 text-[11px]"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] sm:text-[13px] font-bold text-neutral-900 truncate tracking-tight">
              {fullName}
            </div>
            {userEmail && userEmail !== "anonymous" && (
              <div className="text-[10px] sm:text-[11px] text-neutral-500 font-normal truncate mt-0.5">
                {userEmail}
              </div>
            )}
          </div>
        </div>

        {/* PRO STATUS / UPGRADE PILL */}
        {isDemo ? (
          <div className="mt-2 flex items-center justify-between px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="text-[9.5px] font-bold uppercase tracking-wider">Demo Account</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLockedFeature("Upgrading to Pro");
              }}
              className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2 cursor-pointer"
            >
              Upgrade
            </button>
          </div>
        ) : isPremium ? (
          <div className="mt-2 flex items-center justify-between px-2 py-1 rounded-lg bg-[#12A394]/10 border border-[#12A394]/20 text-[#12A394] select-none">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-[#12A394]" />
              <span className="text-[9.5px] font-bold uppercase tracking-wider">Cloud Pro Active</span>
            </div>
            <span className="text-[9px] font-semibold text-[#12A394]/80">Unlimited</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigate("/pricing");
            }}
            className="mt-2 w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#12A394] hover:bg-[#0E8A7D] text-white transition-colors shadow-xs cursor-pointer group"
          >
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 fill-white text-white" />
              <span className="text-[10.5px] font-bold">Upgrade to Pro</span>
            </div>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* ─── ACTION MENU ITEMS ─── */}
      <div className="mt-1 space-y-0.5">
        <button
          type="button"
          onClick={() => {
            onClose();
            onNavigate("/pricing");
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11.5px] sm:text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/80 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#12A394]" />
            <span>Pricing &amp; Plans</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono group-hover:text-neutral-600">₹9/mo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            if (isDemo) {
              onLockedFeature("Settings");
            } else {
              onNavigate("/settings");
            }
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11.5px] sm:text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-3.5 w-3.5 text-neutral-500" />
            <span>Settings</span>
          </div>
          {isDemo && <Lock className="h-3 w-3 text-amber-600/70" />}
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onNavigate("/support");
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11.5px] sm:text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-3.5 w-3.5 text-neutral-500" />
            <span>Support &amp; Help</span>
          </div>
        </button>
      </div>

      {/* ─── DIVIDER ─── */}
      <div className="h-px bg-neutral-200/80 my-1 mx-1" />

      {/* ─── LOGOUT ─── */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onLogout();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11.5px] sm:text-xs font-semibold text-rose-600 hover:bg-rose-50/80 hover:text-rose-700 transition-colors cursor-pointer"
      >
        <LogOut className="h-3.5 w-3.5 text-rose-500" />
        <span>Sign Out</span>
      </button>
    </m.div>
  );
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const hasMobileHubTabs = ["/resumes", "/jobs", "/tools"].includes(location.pathname);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    let wasScrolled = false;
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== wasScrolled) {
        wasScrolled = isScrolled;
        if (isScrolled) {
          document.body.classList.add("scrolled-header");
        } else {
          document.body.classList.remove("scrolled-header");
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.classList.remove("scrolled-header");
    };
  }, []);

  // 1. Enforce authentication checking
  const token = localStorage.getItem("outly_token");
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Synchronous cache retrieval for 0ms instantaneous render
  const cachedUser = useMemo(() => {
    try {
      const saved = localStorage.getItem("outly_user_session");
      if (saved) return JSON.parse(saved);
      const name = localStorage.getItem("outly_user_name");
      const pic = localStorage.getItem("outly_user_avatar");
      if (name || pic) {
        return {
          user: {
            fullName: name || "Outly User",
            profilePic: pic || undefined,
            email: localStorage.getItem("outly_user_email") || "",
            plan: localStorage.getItem("outly_premium_user") === "true" ? "pro" : "free",
          }
        };
      }
    } catch { }
    return undefined;
  }, []);

  // 2. Fetch current user session with cached initialData
  const { data: userData, error, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.auth.me,
    enabled: !!token,
    retry: false,
    initialData: cachedUser,
    staleTime: 1000 * 60 * 30,
  });

  // Keep localStorage and browser image cache warmed
  useEffect(() => {
    if (userData?.user) {
      if (userData.user.fullName) {
        localStorage.setItem("outly_user_name", userData.user.fullName);
      }
      if (userData.user.profilePic) {
        localStorage.setItem("outly_user_avatar", userData.user.profilePic);
        const img = new Image();
        img.src = userData.user.profilePic;
      }
      if (userData.user.email) {
        localStorage.setItem("outly_user_email", userData.user.email);
      }
      localStorage.setItem("outly_user_session", JSON.stringify(userData));
    }
  }, [userData]);

  useEffect(() => {
    if (error) {
      // Retain guest demo session even if background network check fails
      if (localStorage.getItem("outly_is_demo") === "true") {
        return;
      }
      api.auth.logout();
      navigate("/login");
    }
  }, [error, navigate]);

  // Hover states for desktop dropdowns
  const [activeDropdown, setActiveDropdown] = useState<"resumes" | "jobs" | "tools" | null>(null);
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const dropdownCloseTimer = useRef<number | null>(null);
  const headerNavRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileProfileMenuRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoadedEmail, setNotificationsLoadedEmail] = useState("");
  const userEmail = userData?.user?.email || "anonymous";
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const desktopNotificationMenuRef = useRef<HTMLDivElement>(null);
  const mobileNotificationMenuRef = useRef<HTMLDivElement>(null);
  const [demoTimerOpen, setDemoTimerOpen] = useState(false);
  const demoTimerRef = useRef<HTMLDivElement>(null);

  // Sync state FROM localStorage once userEmail is loaded
  useEffect(() => {
    if (token && !userData) return;

    const emailToLoad = userData?.user?.email || "anonymous";
    try {
      const saved = localStorage.getItem(`outly_notifications_${emailToLoad}`);
      if (saved && saved !== "undefined") {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Deduplicate "Upgraded to Pro" notifications
          const seenProUpgrade = { value: false };
          const cleaned = parsed.filter((n: NotificationItem) => {
            if (n && n.title === "Upgraded to Pro") {
              if (seenProUpgrade.value) {
                return false;
              }
              seenProUpgrade.value = true;
            }
            return true;
          });
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(`outly_notifications_${emailToLoad}`, JSON.stringify(cleaned));
            setNotifications(cleaned);
          } else {
            setNotifications(parsed);
          }
        } else {
          setNotifications([]);
        }
      } else {
        const welcome: NotificationItem = {
          id: "welcome",
          title: "Welcome to Outly",
          description: "Upgrade to Pro to unlock unlimited resume tailoring, Job tracking & ATS checker.",
          time: "Just now",
          read: false
        };
        setNotifications([welcome]);
        localStorage.setItem(`outly_notifications_${emailToLoad}`, JSON.stringify([welcome]));
      }
    } catch (err) {
      console.error("Failed to parse notifications:", err);
      const welcome: NotificationItem = {
        id: "welcome",
        title: "Welcome to Outly",
        description: "Upgrade to Pro to unlock unlimited resume tailoring, Job tracking & ATS checker.",
        time: "Just now",
        read: false
      };
      setNotifications([welcome]);
    }
    setNotificationsLoadedEmail(emailToLoad);
  }, [userData?.user?.email, token]);

  useEffect(() => {
    if (notificationsLoadedEmail !== userEmail) return;

    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const newItem: NotificationItem = {
          id: Date.now().toString(),
          title: customEvent.detail.title,
          description: customEvent.detail.description,
          time: "Just now",
          read: false
        };
        setNotifications(prev => {
          // Prevent duplicate "Upgraded to Pro" notifications in state
          if (customEvent.detail.title === "Upgraded to Pro" && prev.some(n => n.title === "Upgraded to Pro")) {
            return prev;
          }
          const updated = [newItem, ...prev];
          localStorage.setItem(`outly_notifications_${userEmail}`, JSON.stringify(updated));
          return updated;
        });
      }
    };

    window.addEventListener("outly-notification", handleNewNotification);
    return () => window.removeEventListener("outly-notification", handleNewNotification);
  }, [userEmail, notificationsLoadedEmail]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOutsideDesktop = !desktopNotificationMenuRef.current || !desktopNotificationMenuRef.current.contains(target);
      const clickedOutsideMobile = !mobileNotificationMenuRef.current || !mobileNotificationMenuRef.current.contains(target);
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (demoTimerRef.current && !demoTimerRef.current.contains(target)) {
        setDemoTimerOpen(false);
      }
    };
    if (demoTimerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [demoTimerOpen]);

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem(`outly_notifications_${userEmail}`, JSON.stringify(updated));
      return updated;
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;



  // Pricing & Razorpay Billing states
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (userData?.user?.plan) {
      setIsPremium(userData.user.plan === "pro");
      localStorage.setItem("outly_premium_user", String(userData.user.plan === "pro"));
    }
  }, [userData]);

  useEffect(() => {
    const checkPremiumStatus = (e?: Event) => {
      // If it's a storage event, only respond if the key is "outly_premium_user"
      if (e && e.type === "storage") {
        const storageEvent = e as StorageEvent;
        if (storageEvent.key !== "outly_premium_user") {
          return;
        }
      }

      const isNowPremium = localStorage.getItem("outly_premium_user") === "true";
      setIsPremium(isNowPremium);

      // Dispatch notification on upgrade success
      if (isNowPremium) {
        // Read current notifications to see if they already contain "Upgraded to Pro"
        const saved = localStorage.getItem(`outly_notifications_${userEmail}`);
        let alreadyNotified = false;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              alreadyNotified = parsed.some((n: any) => n.title === "Upgraded to Pro");
            }
          } catch (err) {
            console.error(err);
          }
        }

        if (!alreadyNotified) {
          window.dispatchEvent(new CustomEvent("outly-notification", {
            detail: {
              title: "Upgraded to Pro",
              description: "Congratulations! You have successfully upgraded to Outly Pro. Unlimited resume tailoring, Job tracking & ATS scans are now active."
            }
          }));
        }
      }
    };
    window.addEventListener("storage", checkPremiumStatus);
    window.addEventListener("premium_upgrade", checkPremiumStatus);
    return () => {
      window.removeEventListener("storage", checkPremiumStatus);
      window.removeEventListener("premium_upgrade", checkPremiumStatus);
    };
  }, [userEmail]);

  // Fetch settings from API to personalize the dashboard profile
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
    enabled: !!token,
  });

  const pageTitle = pageTitles[location.pathname] ?? "Page Not Found";

  useEffect(() => {
    document.title = `Outly - ${pageTitle}`;
  }, [pageTitle]);

  useEffect(() => {
    setActiveDropdown(null);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOutsideDesktop = !profileMenuRef.current || !profileMenuRef.current.contains(target);
      const clickedOutsideMobile = !mobileProfileMenuRef.current || !mobileProfileMenuRef.current.contains(target);

      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    return () => {
      if (dropdownCloseTimer.current) {
        window.clearTimeout(dropdownCloseTimer.current);
      }
    };
  }, []);

  const handleUpgradeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const buttonRect = button.getBoundingClientRect();
    const xCenter = buttonRect.left + buttonRect.width / 2;
    const yCenter = buttonRect.top + buttonRect.height / 2;
    const clientX = e.clientX || xCenter;
    const clientY = e.clientY || yCenter;

    for (let i = 0; i < 15; i++) {
      createParticle(clientX, clientY);
    }

    setTimeout(() => {
      navigate("/pricing");
    }, 150);
  };

  const createParticle = (x: number, y: number) => {
    const particle = document.createElement("div");
    particle.className = "premium-particle";
    document.body.appendChild(particle);

    const size = Math.random() * 8 + 4;
    const colors = ["#2dc08d", "#19cc95", "#10b981", "#34d399", "#059669"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = randomColor;
    particle.style.left = `${x - size / 2}px`;
    particle.style.top = `${y - size / 2}px`;

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 80 + 40;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance;

    particle.style.setProperty("--x", `${destX}px`);
    particle.style.setProperty("--y", `${destY}px`);

    particle.style.animation = "premiumShoot 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards";

    particle.addEventListener("animationend", () => {
      particle.remove();
    });
  };

  const cachedName = typeof window !== "undefined" ? localStorage.getItem("outly_user_name") : null;
  const cachedAvatar = typeof window !== "undefined" ? localStorage.getItem("outly_user_avatar") : null;
  const fullName = userData?.user?.fullName || cachedName || settings?.full_name || "Outly User";
  const profilePic = userData?.user?.profilePic || cachedAvatar || undefined;
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "OU";

  const queryClient = useQueryClient();
  const handleLogout = () => {
    api.auth.logout();
    queryClient.clear();
    navigate("/login");
  };

  const openDropdown = (dropdown: "resumes" | "jobs" | "tools") => {
    if (dropdownCloseTimer.current) {
      window.clearTimeout(dropdownCloseTimer.current);
      dropdownCloseTimer.current = null;
    }
    setActiveDropdown(dropdown);
  };

  const scheduleDropdownClose = () => {
    if (dropdownCloseTimer.current) {
      window.clearTimeout(dropdownCloseTimer.current);
    }
    dropdownCloseTimer.current = window.setTimeout(() => {
      setActiveDropdown(null);
      dropdownCloseTimer.current = null;
    }, 120);
  };

  const toggleDropdown = (dropdown: "resumes" | "jobs" | "tools") => {
    if (dropdownCloseTimer.current) {
      window.clearTimeout(dropdownCloseTimer.current);
      dropdownCloseTimer.current = null;
    }
    setActiveDropdown((current) => (current === dropdown ? null : dropdown));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerNavRef.current && !headerNavRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeGuide) {
          setActiveGuide(null);
        }
        if (activeDropdown) {
          const currentKey = activeDropdown;
          setActiveDropdown(null);
          triggerRefs.current[currentKey]?.focus();
        }
      }
    };

    if (activeDropdown || activeGuide) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDropdown, activeGuide]);

  const isResumeActive = location.pathname.startsWith("/resume-") || location.pathname === "/ats-score" || location.pathname === "/resume-vault" || location.pathname === "/resumes";
  const isJobsActive = location.pathname === "/job-search" || location.pathname === "/applications" || location.pathname === "/analytics" || location.pathname === "/jobs";
  const isToolsActive = ["/cold-mail", "/linkedin-posts", "/twitter", "/logs", "/tools"].some(path => location.pathname.startsWith(path));
  const isPricingActive = location.pathname === "/pricing";
  const isSupportActive = location.pathname === "/support";

  const isDemo = Boolean(userData?.user?.isDemo) || localStorage.getItem("outly_is_demo") === "true";

  // Demo session countdown timer
  const [demoTimeLeft, setDemoTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!isDemo) return;

    const checkTime = () => {
      let expTime: number | null = null;
      const savedExp = localStorage.getItem("outly_demo_expires_at");
      if (savedExp) {
        expTime = new Date(savedExp).getTime();
      } else {
        const token = localStorage.getItem("outly_token");
        if (token) {
          try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(window.atob(base64));
            if (payload.exp) expTime = payload.exp * 1000;
          } catch (_) { }
        }
      }

      if (expTime) {
        const diff = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
        setDemoTimeLeft(diff);
        if (diff <= 0) {
          window.dispatchEvent(
            new CustomEvent("outly_demo_modal", {
              detail: {
                code: "DEMO_EXPIRED",
                message: "Your 25-minute demo session has ended. Sign up with Google to continue!",
                isExpired: true,
              },
            })
          );
        }
      } else {
        setDemoTimeLeft(25 * 60);
      }
    };

    checkTime();
    const timer = setInterval(checkTime, 1000);
    return () => clearInterval(timer);
  }, [isDemo]);

  const demoCountdown = useMemo(() => {
    if (demoTimeLeft === null) return "25:00";
    const mins = Math.floor(demoTimeLeft / 60);
    const secs = demoTimeLeft % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }, [demoTimeLeft]);

  const handleLockedDemoFeature = (featureName: string) => {
    window.dispatchEvent(
      new CustomEvent("outly_demo_modal", {
        detail: {
          code: "DEMO_LOCKED_FEATURE",
          message: `${featureName} is locked in demo mode. Sign in with Google to customize settings and upgrade.`,
          isExpired: false,
        },
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#171717] flex flex-col font-sans overflow-x-clip">

      {/* Header Spacer Wrapper to prevent layout shift */}
      <div className={`${hasMobileHubTabs ? "h-0 md:h-16" : "h-16"} w-full shrink-0 relative bg-white`}>
        {/* ─── TOP NAVIGATION HEADER (FULL WIDTH) ─── */}
        <header
          ref={headerNavRef}
          className="fixed top-0 left-0 right-0 z-[100] w-full border-b border-black/[0.07] bg-white/95 backdrop-blur-[28px] shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-2px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] shrink-0 select-none h-16 mobile-scroll-header"
          onMouseLeave={scheduleDropdownClose}
        >
          <div className="flex w-full items-center justify-between px-4 sm:px-10 lg:px-12 h-16">

            {/* Left: Brand Logo */}
            <div className="flex h-full items-center gap-10 lg:gap-12">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-[8px] no-underline select-none hover:opacity-80 transition-opacity duration-150 shrink-0"
                aria-label="Outly home"
              >
                <Send size={20} strokeWidth={2} className="shrink-0 text-[#12A394]" />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: '#12A394', lineHeight: 1 }}>Outly</span>
              </Link>

              {/* Middle: Desktop Links & Dropdowns */}
              <nav className="hidden h-full items-center gap-1.5 font-sans md:flex relative xl:gap-4">
                {MEGA_MENUS.map((menu) => {
                  const isOpen = activeDropdown === menu.key;
                  const isPageActive =
                    (menu.key === "resumes" && isResumeActive) ||
                    (menu.key === "jobs" && isJobsActive) ||
                    (menu.key === "tools" && isToolsActive);

                  return (
                    <button
                      key={menu.key}
                      ref={(el) => { triggerRefs.current[menu.key] = el; }}
                      type="button"
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      aria-controls={`mn-panel-${menu.key}`}
                      onClick={() => toggleDropdown(menu.key)}
                      onMouseEnter={() => openDropdown(menu.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                          e.preventDefault();
                          openDropdown(menu.key);
                        }
                      }}
                      className={`mn-trigger ${isOpen || isPageActive ? "is-active" : ""}`}
                    >
                      <span>{menu.label}</span>
                      <ChevronDown className="mn-chevron" />
                    </button>
                  );
                })}

                {/* Standalone Link: PRICING */}
                {isDemo ? (
                  <button
                    type="button"
                    onClick={() => handleLockedDemoFeature("Pricing & Billing")}
                    className="mn-trigger text-[#403E3B] font-medium"
                  >
                    <span>Pricing</span>
                    <Lock className="w-3 h-3 text-amber-600/70 ml-1" />
                  </button>
                ) : (
                  <Link
                    to="/pricing"
                    className={`mn-trigger ${isPricingActive ? "is-active" : ""}`}
                  >
                    <span>Pricing</span>
                  </Link>
                )}

                {/* Standalone Link: SUPPORT */}
                <Link
                  to="/support"
                  className={`mn-trigger ${isSupportActive ? "is-active" : ""}`}
                >
                  <span>Support</span>
                </Link>

                {/* Mega Panel Floating Card (Anchored to Nav/Resume Section) */}
                <div
                  className={`mn-dropdown-floating ${activeDropdown ? "is-open" : ""}`}
                  aria-hidden={!activeDropdown}
                  onMouseEnter={() => {
                    if (dropdownCloseTimer.current) {
                      window.clearTimeout(dropdownCloseTimer.current);
                      dropdownCloseTimer.current = null;
                    }
                  }}
                  onMouseLeave={scheduleDropdownClose}
                >
                  <div className="mn-panel-inner">
                    <AnimatePresence mode="wait" initial={false}>
                      {activeDropdown && (
                        <m.div
                          key={activeDropdown}
                          id={`mn-panel-${activeDropdown}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15, ease: "easeInOut" }}
                          className="mn-panel-grid"
                        >
                          {MEGA_MENUS.find((m) => m.key === activeDropdown)?.groups.map((group, gIdx, allGroups) => {
                            const isLastCol = gIdx === allGroups.length - 1;
                            const currentMenu = MEGA_MENUS.find((m) => m.key === activeDropdown);

                            return (
                              <div key={group.heading} className="mn-column">
                                <div className="mn-heading">{group.heading}</div>
                                <div>
                                  {group.items.map((item) => {
                                    const IconComponent = item.icon;

                                    if (item.href) {
                                      return (
                                        <Link
                                          key={item.title}
                                          to={item.href}
                                          tabIndex={activeDropdown ? 0 : -1}
                                          onClick={() => setActiveDropdown(null)}
                                          className="mn-item"
                                        >
                                          <div className="mn-icon-tile">
                                            <IconComponent size={16} strokeWidth={1.6} />
                                          </div>
                                          <div className="mn-text-col">
                                            <div className="mn-title-row">
                                              <span className="mn-title">{item.title}</span>
                                              {item.badge && <span className="mn-badge">{item.badge}</span>}
                                            </div>
                                            <span className="mn-desc">{item.desc}</span>
                                          </div>
                                        </Link>
                                      );
                                    }

                                    return (
                                      <button
                                        key={item.title}
                                        type="button"
                                        tabIndex={activeDropdown ? 0 : -1}
                                        onClick={() => {
                                          setActiveDropdown(null);
                                          if (item.guideKey) setActiveGuide(item.guideKey);
                                        }}
                                        className="mn-item"
                                      >
                                        <div className="mn-icon-tile">
                                          <IconComponent size={16} strokeWidth={1.6} />
                                        </div>
                                        <div className="mn-text-col">
                                          <div className="mn-title-row">
                                            <span className="mn-title">{item.title}</span>
                                            {item.badge && <span className="mn-badge">{item.badge}</span>}
                                          </div>
                                          <span className="mn-desc">{item.desc}</span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Optional footer link at the bottom of the last column */}
                                {isLastCol && currentMenu?.footerLink && (
                                  currentMenu.footerLink.href ? (
                                    <Link
                                      to={currentMenu.footerLink.href}
                                      tabIndex={activeDropdown ? 0 : -1}
                                      onClick={() => setActiveDropdown(null)}
                                      className="mn-footer-link"
                                    >
                                      <span>{currentMenu.footerLink.label}</span>
                                      <ArrowRight size={14} strokeWidth={1.6} />
                                    </Link>
                                  ) : (
                                    <button
                                      type="button"
                                      tabIndex={activeDropdown ? 0 : -1}
                                      onClick={() => {
                                        setActiveDropdown(null);
                                        if (currentMenu.footerLink?.guideKey) setActiveGuide(currentMenu.footerLink.guideKey);
                                      }}
                                      className="mn-footer-link"
                                    >
                                      <span>{currentMenu.footerLink.label}</span>
                                      <ArrowRight size={14} strokeWidth={1.6} />
                                    </button>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </nav>
            </div>

            {/* Right Side: Profile initials & Logout CTA */}
            <div className="flex items-center gap-2.5 sm:gap-3.5">

              {/* Demo Mode Compact Clock SVG Icon with Popover */}
              {isDemo && (
                <div className="relative shrink-0" ref={demoTimerRef}>
                  <button
                    type="button"
                    onClick={() => setDemoTimerOpen(prev => !prev)}
                    className="relative p-2 text-[#12A394] hover:text-[#0E8A7D] active:scale-90 transition-all outline-none rounded-full bg-[#12A394]/10 hover:bg-[#12A394]/15 border border-[#12A394]/20 cursor-pointer flex items-center justify-center shrink-0"
                    aria-label="Demo Session Timer"
                    title={`Guest Demo Mode: ${demoCountdown} remaining. Click for details.`}
                  >
                    <Clock className="w-[18px] h-[18px]" strokeWidth={2.2} />
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#12A394] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#12A394]" />
                    </span>
                  </button>

                  <AnimatePresence>
                    {demoTimerOpen && (
                      <m.div
                        variants={popoverVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ transformOrigin: "top right" }}
                        className="absolute right-[-48px] sm:right-0 top-full mt-2.5 w-[285px] sm:w-[310px] rounded-2xl bg-white border border-[#E8E2D5] font-sans shadow-xl z-[130] p-4 text-left select-none"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-black/[0.05]">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#12A394]/10 text-[#12A394] flex items-center justify-center">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[12.5px] font-bold text-[#171717] block leading-none">Guest Demo</span>
                              <span className="text-[10px] text-[#888] font-medium leading-tight">25-min session</span>
                            </div>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-[#12A394] bg-[#12A394]/10 border border-[#12A394]/20 px-2.5 py-0.5 rounded-full">
                            {demoCountdown} left
                          </span>
                        </div>

                        {/* Progress Bar & Details */}
                        <div className="py-3">
                          <div className="flex items-center justify-between text-[11px] text-[#6B6B66] mb-1.5 font-medium">
                            <span>Time remaining</span>
                            <span className="font-mono text-[#171717] font-semibold">{demoCountdown}</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#12A394] rounded-full transition-all duration-1000"
                              style={{
                                width: `${demoTimeLeft !== null ? Math.max(0, Math.min(100, Math.round((demoTimeLeft / (25 * 60)) * 100))) : 100}%`
                              }}
                            />
                          </div>
                          <p className="text-[11.5px] text-[#6B6B66] leading-relaxed mt-2.5 mb-0">
                            You are exploring Outly in a guest demo session. Sign up to save your resume, tailored versions, and outreach queue.
                          </p>
                        </div>

                        {/* Upgrade / Sign Up CTA */}
                        <div className="pt-2 border-t border-black/[0.05]">
                          <button
                            type="button"
                            onClick={() => {
                              setDemoTimerOpen(false);
                              window.dispatchEvent(
                                new CustomEvent("outly_demo_modal", {
                                  detail: {
                                    code: "DEMO_NAV_CLICK",
                                    message: "Sign up with Google to keep your work and unlock unlimited scans and outreach.",
                                    isExpired: false,
                                  },
                                })
                              );
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#111111] hover:bg-black text-white text-[12px] font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#12A394]" />
                            <span>Sign Up to Keep Progress</span>
                          </button>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Desktop Notification Bell */}
              <div className="relative hidden md:block" ref={desktopNotificationMenuRef}>
                <button
                  type="button"
                  className="relative p-2 text-[#4A4844] hover:text-outly-dark active:scale-95 transition-all outline-none rounded-full hover:bg-black/5 cursor-pointer"
                  onClick={() => setNotificationsOpen(prev => !prev)}
                  aria-label="Notifications"
                >
                  <Bell className="h-[19px] w-[19px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#EF4444] text-[9px] font-bold text-white leading-none shadow-xs ring-2 ring-outly-cream">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <m.div
                      variants={popoverVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      style={{ transformOrigin: "top right" }}
                      className="absolute right-0 top-full mt-2.5 w-[300px] rounded-2xl bg-card border border-[#e8e2d5] font-sans shadow-xl z-[125] py-2"
                    >
                      <div className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-[10px] font-extrabold text-[#f23c5d] hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="divide-y divide-zinc-50 max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-xs text-zinc-400 font-semibold">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map(item => (
                            <div key={item.id} className="px-4 py-3 text-left transition-colors hover:bg-zinc-50/50 flex gap-2.5 items-start">
                              {!item.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f23c5d] shrink-0 mt-1.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-[11.5px] font-bold text-zinc-800 truncate">{item.title}</span>
                                  <span className="text-[8.5px] text-zinc-400 font-medium shrink-0">{item.time}</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 leading-normal mt-0.5 font-medium">{item.description}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Desktop Profile Info & Logout Dropdown */}
              <div className="relative hidden md:block" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(prev => !prev)}
                  className="flex items-center gap-2.5 select-none hover:opacity-85 transition focus:outline-none cursor-pointer py-1.5 px-2.5 rounded-xl hover:bg-black/5"
                >
                  <PlanStatusAvatar isPremium={isPremium} profilePic={profilePic} fullName={fullName} initials={initials} sizeClass="h-8 w-8 text-[11px]" />
                  <span className="text-[12px] font-bold text-foreground max-w-[120px] truncate">{fullName}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${profileMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <ProfileDropdownMenu
                      isPremium={isPremium}
                      profilePic={profilePic}
                      fullName={fullName}
                      initials={initials}
                      userEmail={userEmail}
                      isDemo={isDemo}
                      onClose={() => setProfileMenuOpen(false)}
                      onNavigate={navigate}
                      onLogout={handleLogout}
                      onLockedFeature={handleLockedDemoFeature}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Notification Bell */}
              <div className="relative md:hidden mr-1" ref={mobileNotificationMenuRef}>
                <button
                  type="button"
                  className="relative p-2 text-[#4A4844] active:scale-90 transition-transform duration-150 outline-none rounded-full hover:bg-black/5"
                  onClick={() => setNotificationsOpen(prev => !prev)}
                  aria-label="Notifications"
                >
                  <Bell className="h-[21px] w-[21px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#EF4444] text-[9px] font-bold text-white leading-none shadow-xs ring-2 ring-outly-cream">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <m.div
                      variants={popoverVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      style={{ transformOrigin: "top right", backgroundColor: "#ffffff" }}
                      className="absolute right-[-48px] top-full mt-2 w-[280px] rounded-2xl bg-white border border-[#E8E8E6] font-sans shadow-[0_16px_40px_-8px_rgba(20,25,30,0.18),0_2px_6px_rgba(0,0,0,0.06)] z-[145] py-2.5"
                    >
                      <div className="px-4 pb-2 border-b border-zinc-50 flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-[10px] font-extrabold text-[#f23c5d] hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="divide-y divide-zinc-50 max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-xs text-zinc-400 font-semibold">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map(item => (
                            <div key={item.id} className="px-4 py-3 text-left transition-colors hover:bg-zinc-50/50 flex gap-2.5 items-start">
                              {!item.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f23c5d] shrink-0 mt-1.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-[12px] font-bold text-zinc-800 truncate">{item.title}</span>
                                  <span className="text-[9px] text-zinc-400 font-medium shrink-0">{item.time}</span>
                                </div>
                                <p className="text-[10.5px] text-zinc-500 leading-normal mt-0.5 font-medium">{item.description}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Profile Avatar Trigger & Dropdown */}
              <div className="relative md:hidden" ref={mobileProfileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(prev => !prev)}
                  type="button"
                  className="flex items-center justify-center focus:outline-none cursor-pointer shrink-0"
                  aria-label="Open profile menu"
                >
                  <PlanStatusAvatar
                    isPremium={isPremium}
                    profilePic={profilePic}
                    fullName={fullName}
                    initials={initials}
                    sizeClass="h-8 w-8 text-[11px]"
                  />
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <ProfileDropdownMenu
                      isPremium={isPremium}
                      profilePic={profilePic}
                      fullName={fullName}
                      initials={initials}
                      userEmail={userEmail}
                      isDemo={isDemo}
                      onClose={() => setProfileMenuOpen(false)}
                      onNavigate={navigate}
                      onLogout={handleLogout}
                      onLockedFeature={handleLockedDemoFeature}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* ─── MAIN CONTENT LAYOUT (FULL WIDTH) ─── */}
      <main className="flex-1 w-full flex flex-col min-h-0 pb-24 md:pb-0 overflow-x-clip">
        {children}
      </main>

      {/* ─── MOBILE BOTTOM TAB BAR (iOS-STYLE SPRING INDICATOR) ─── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] w-full h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 backdrop-blur-[20px] border-t border-black/[0.07] flex items-center justify-around shadow-[0_-1px_0_0_rgba(255,255,255,0.8)_inset,0_-4px_12px_-2px_rgba(0,0,0,0.05)] select-none">

        {/* Tab 1: Resumes */}
        <Link
          to="/resumes"
          className="relative flex-1 h-full flex flex-col items-center justify-center focus:outline-none active:scale-90 transition-transform duration-150"
        >
          {(() => {
            const isActive = location.pathname === "/resumes" ||
              location.pathname === "/resume-vault" ||
              location.pathname === "/resume-tailor" ||
              location.pathname === "/ats-score" ||
              location.pathname.startsWith("/resume-");
            return (
              <>
                {isActive && (
                  <m.div
                    layoutId="mobile-bottom-indicator"
                    className="absolute top-0 w-10 h-[3px] bg-[#12A394] rounded-b-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <m.div
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  className={`transition-colors duration-200 ${isActive ? "text-[#12A394]" : "text-[#6a6a66]/60"}`}
                >
                  <ScrollText className="h-5 w-5" />
                </m.div>
                <span className={`mt-1 text-[10px] transition-colors duration-200 ${isActive ? "font-semibold text-[#12A394]" : "font-medium text-[#6a6a66]/70"}`}>
                  Resumes
                </span>
              </>
            );
          })()}
        </Link>

        {/* Tab 2: Jobs */}
        <Link
          to="/jobs"
          className="relative flex-1 h-full flex flex-col items-center justify-center focus:outline-none active:scale-90 transition-transform duration-150"
        >
          {(() => {
            const isActive = location.pathname === "/jobs" ||
              location.pathname === "/applications" ||
              location.pathname === "/job-search" ||
              location.pathname === "/analytics";
            return (
              <>
                {isActive && (
                  <m.div
                    layoutId="mobile-bottom-indicator"
                    className="absolute top-0 w-10 h-[3px] bg-[#12A394] rounded-b-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <m.div
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  className={`transition-colors duration-200 ${isActive ? "text-[#12A394]" : "text-[#6a6a66]/60"}`}
                >
                  <Briefcase className="h-5 w-5" />
                </m.div>
                <span className={`mt-1 text-[10px] transition-colors duration-200 ${isActive ? "font-semibold text-[#12A394]" : "font-medium text-[#6a6a66]/70"}`}>
                  Jobs
                </span>
              </>
            );
          })()}
        </Link>

        {/* Tab 3: Tools */}
        <Link
          to="/tools"
          className="relative flex-1 h-full flex flex-col items-center justify-center focus:outline-none active:scale-90 transition-transform duration-150"
        >
          {(() => {
            const isActive = location.pathname === "/tools" ||
              location.pathname === "/cold-mail" ||
              location.pathname === "/logs";
            return (
              <>
                {isActive && (
                  <m.div
                    layoutId="mobile-bottom-indicator"
                    className="absolute top-0 w-10 h-[3px] bg-[#12A394] rounded-b-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <m.div
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  className={`transition-colors duration-200 ${isActive ? "text-[#12A394]" : "text-[#6a6a66]/60"}`}
                >
                  <Wrench className="h-5 w-5" />
                </m.div>
                <span className={`mt-1 text-[10px] transition-colors duration-200 ${isActive ? "font-semibold text-[#12A394]" : "font-medium text-[#6a6a66]/70"}`}>
                  Tools
                </span>
              </>
            );
          })()}
        </Link>

        {/* Tab 4: Profile */}
        {isDemo ? (
          <button
            type="button"
            onClick={() => handleLockedDemoFeature("Profile Settings")}
            className="relative flex-1 h-full flex flex-col items-center justify-center focus:outline-none active:scale-90 transition-transform duration-150 cursor-pointer"
          >
            <div className="relative text-zinc-500/70">
              <User className="h-5 w-5" />
              <Lock className="h-2.5 w-2.5 text-amber-600 absolute -top-1 -right-1" />
            </div>
            <span className="mt-1 text-[10px] font-medium text-zinc-500/80">
              Profile
            </span>
          </button>
        ) : (
          <Link
            to="/settings"
            className="relative flex-1 h-full flex flex-col items-center justify-center focus:outline-none active:scale-90 transition-transform duration-150"
          >
            {(() => {
              const isActive = location.pathname === "/settings" ||
                location.pathname === "/pricing" ||
                location.pathname === "/support";
              return (
                <>
                  {isActive && (
                    <m.div
                      layoutId="mobile-bottom-indicator"
                      className="absolute top-0 w-10 h-[3px] bg-[#12A394] rounded-b-full"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <m.div
                    animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: "spring", stiffness: 450, damping: 28 }}
                    className={`transition-colors duration-200 ${isActive ? "text-[#12A394]" : "text-[#6a6a66]/60"}`}
                  >
                    <User className="h-5 w-5" />
                  </m.div>
                  <span className={`mt-1 text-[10px] transition-colors duration-200 ${isActive ? "font-semibold text-[#12A394]" : "font-medium text-[#6a6a66]/70"}`}>
                    Profile
                  </span>
                </>
              );
            })()}
          </Link>
        )}

      </div>

      {/* ─── INTERACTIVE EDUCATIONAL GUIDE MODAL (MOTION ANIMATED) ─── */}
      <AnimatePresence>
        {activeGuide && guidesData[activeGuide] && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/45 backdrop-blur-[6px]"
              onClick={() => setActiveGuide(null)}
            />

            {/* Modal Card with Smooth Spring Entrance */}
            <m.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative z-[501] w-full max-w-[580px] max-h-[85vh] overflow-y-auto bg-white rounded-[24px] border border-black/[0.06] p-7 sm:p-8 shadow-[0_28px_72px_-12px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.04)] select-none modal-scroll text-left"
            >
              {/* Close X Button */}
              <button
                type="button"
                onClick={() => setActiveGuide(null)}
                className="absolute right-5 top-5 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>

              {/* Header */}
              <div className="border-b border-black/[0.06] pb-4.5 pr-8">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-wider uppercase text-[#12A394] bg-[#12A394]/10 px-2.5 py-0.5 rounded-full mb-2.5">
                  <BookOpen size={12} className="text-[#12A394]" />
                  Career Guide
                </span>
                <h2 className="text-[21px] sm:text-[23px] font-semibold text-[#111111] leading-tight tracking-[-0.025em]">
                  {guidesData[activeGuide].title}
                </h2>
                <p className="text-[13px] text-[#666666] leading-relaxed mt-1.5">
                  {guidesData[activeGuide].description}
                </p>
              </div>

              {/* Content */}
              <div className="py-4.5">
                {guidesData[activeGuide].content}
              </div>

              {/* Footer */}
              <div className="border-t border-black/[0.06] pt-4.5 flex items-center justify-between">
                <span className="text-[11.5px] text-[#888888] font-medium hidden sm:inline">
                  Outly Knowledge Base • Press Esc to close
                </span>
                <button
                  type="button"
                  onClick={() => setActiveGuide(null)}
                  className="rounded-full bg-[#12A394] hover:bg-[#0B8A7D] text-white text-[13px] font-medium px-5 py-2 transition-all shadow-[0_2px_8px_rgba(18,163,148,0.22)] hover:shadow-[0_4px_14px_rgba(18,163,148,0.32)] active:scale-95 cursor-pointer ml-auto"
                >
                  Close Guide
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>



    </div>
  );
}

// ─── HIGH-QUALITY CAREER GUIDES & LEARNING CONTENT ───
const guidesData: Record<string, { title: string; description: string; content: React.ReactNode }> = {
  "how-to-write": {
    title: "How to Write a Professional Resume",
    description: "Learn the foundational principles of writing a resume that secures interviews.",
    content: (
      <div className="space-y-3.5 text-[13px] text-[#333333] leading-relaxed">
        <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-4">
          <p className="font-semibold text-[13.5px] text-[#111111] mb-1">1. Use the Reverse-Chronological Format</p>
          <p className="text-[#555555]">List your work history starting with your most recent job and working backward. This is the format recruiters prefer and ATS systems parse most accurately.</p>
        </div>
        <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-4">
          <p className="font-semibold text-[13.5px] text-[#111111] mb-1">2. Focus on Achievements, Not Just Duties</p>
          <p className="text-[#555555]">Instead of listing responsibilities like "Responsible for managing a team," write "Led a cross-functional team of 6 engineers to launch our core product 2 weeks ahead of schedule." Use metrics wherever possible.</p>
        </div>
        <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-4">
          <p className="font-semibold text-[13.5px] text-[#111111] mb-1">3. Start Bullets with Strong Action Verbs</p>
          <p className="text-[#555555]">Begin each bullet point with powerful verbs like <em>Spearheaded</em>, <em>Optimized</em>, <em>Engineered</em>, or <em>Architected</em>. Avoid passive phrasing.</p>
        </div>
      </div>
    )
  },
  "resume-format": {
    title: "Choosing the Right Resume Format",
    description: "Understand chronological, functional, and hybrid resume layouts.",
    content: (
      <div className="space-y-3.5 text-[13px] text-[#333333] leading-relaxed">
        <p className="text-[#444444]">Select a format that matches your career level and industry:</p>
        <div className="space-y-2.5">
          <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-3.5">
            <span className="font-semibold text-[13px] text-[#111111] block mb-0.5">Reverse-Chronological</span>
            <span className="text-[#555555]">Best for candidates with a steady career path. Highlights progression and stability.</span>
          </div>
          <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-3.5">
            <span className="font-semibold text-[13px] text-[#111111] block mb-0.5">Functional (Skills-Based)</span>
            <span className="text-[#555555]">Best for career changers or those with employment gaps. Focuses on transferrable skills.</span>
          </div>
          <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-3.5">
            <span className="font-semibold text-[13px] text-[#111111] block mb-0.5">Hybrid (Combination)</span>
            <span className="text-[#555555]">Best for experienced professionals. Features a prominent skills summary at the top followed by chronological history.</span>
          </div>
        </div>
      </div>
    )
  },
  "resume-summary": {
    title: "Writing a Compelling Resume Summary",
    description: "Hook recruiters in 6 seconds with a high-impact professional summary.",
    content: (
      <div className="space-y-4 text-[13px] text-[#333333] leading-relaxed">
        <p className="text-[#444444]">
          Your summary should sit at the very top of your resume and answer three essential questions: <strong>Who are you?</strong> <strong>What are your key achievements?</strong> <strong>What value do you bring?</strong>
        </p>
        <div className="rounded-xl bg-[#F8F9FA] border-l-4 border-[#12A394] border-y border-r border-y-[#E9ECEF] border-r-[#E9ECEF] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#12A394] mb-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#12A394]" /> Example Formula
          </div>
          <p className="italic text-[12.5px] text-[#222222] leading-relaxed">
            "Result-driven Software Engineer with 5+ years of experience building high-performance web applications. Spearheaded transition to microservices, reducing server response times by 40%. Proven track record of optimizing application performance and mentoring junior developers."
          </p>
        </div>
        <p className="text-[#555555]">
          Keep your summary concise—aim for 3 to 4 sentences or bullet points that highlight your most impressive qualifications.
        </p>
      </div>
    )
  },
  "one-page": {
    title: "Fitting Your Experience on One Page",
    description: "Strategies to keep your resume concise, dense, and impactful.",
    content: (
      <div className="space-y-3.5 text-[13px] text-[#333333] leading-relaxed">
        <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-4">
          <p className="font-semibold text-[13.5px] text-[#111111] mb-1">1. The 10-Year Rule</p>
          <p className="text-[#555555]">Only go back 10–15 years in your work history. Older experience is rarely relevant to modern roles and takes up valuable page space.</p>
        </div>
        <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-4">
          <p className="font-semibold text-[13.5px] text-[#111111] mb-1">2. Maximize Whitespace &amp; Margins</p>
          <p className="text-[#555555]">Set your page margins to 0.5 inches (the minimum readable margin) and adjust line height to 1.15 to maximize text space without sacrificing readability.</p>
        </div>
        <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-4">
          <p className="font-semibold text-[13.5px] text-[#111111] mb-1">3. Edit Ruthlessly</p>
          <p className="text-[#555555]">Remove filler words. Combine short bullets. Ensure every single word on the page contributes directly to explaining why you are qualified for the target role.</p>
        </div>
      </div>
    )
  },
  "interview-prep": {
    title: "Mastering the Behavioral Interview",
    description: "Use the STAR method to answer common behavioral and situational questions.",
    content: (
      <div className="space-y-3.5 text-[13px] text-[#333333] leading-relaxed">
        <p className="text-[#444444]">When asked behavioral questions like "Tell me about a time you resolved a conflict," structure your response using the <strong>STAR</strong> method:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-3.5">
            <span className="font-semibold text-[13px] text-[#12A394] block mb-0.5">S • Situation</span>
            <span className="text-[#555555] text-[12.5px]">Set the scene and provide necessary context. Keep it brief.</span>
          </div>
          <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-3.5">
            <span className="font-semibold text-[13px] text-[#12A394] block mb-0.5">T • Task</span>
            <span className="text-[#555555] text-[12.5px]">Describe the challenge, goal, or problem you had to solve.</span>
          </div>
          <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-3.5">
            <span className="font-semibold text-[13px] text-[#12A394] block mb-0.5">A • Action</span>
            <span className="text-[#555555] text-[12.5px]">Explain the specific actions you took. Highlight individual contribution.</span>
          </div>
          <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-3.5">
            <span className="font-semibold text-[13px] text-[#12A394] block mb-0.5">R • Result</span>
            <span className="text-[#555555] text-[12.5px]">Share positive outcomes and data (e.g. "+15% efficiency").</span>
          </div>
        </div>
      </div>
    )
  },
  "salary-negotiation": {
    title: "Salary Negotiation Masterclass",
    description: "Get paid what you are worth with proven negotiation strategies.",
    content: (
      <div className="space-y-3.5 text-[13px] text-[#333333] leading-relaxed">
        <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-4">
          <p className="font-semibold text-[13.5px] text-[#111111] mb-1">1. Research Your Market Value</p>
          <p className="text-[#555555]">Use sites like Glassdoor, Levels.fyi, and LinkedIn to find compensation benchmarks for your role, seniority, and location.</p>
        </div>
        <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-4">
          <p className="font-semibold text-[13.5px] text-[#111111] mb-1">2. Let the Employer Name the First Number</p>
          <p className="text-[#555555]">When asked expectations, defer: "I am flexible and open to a competitive offer that aligns with role responsibilities. What range is budgeted?"</p>
        </div>
        <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-4">
          <p className="font-semibold text-[13.5px] text-[#111111] mb-1">3. Negotiate the Entire Package</p>
          <p className="text-[#555555]">If base salary is fixed, negotiate signing bonuses, equity, remote flexibility, or additional paid time off.</p>
        </div>
      </div>
    )
  },
  "linkedin-networking": {
    title: "Networking on LinkedIn Effectively",
    description: "How to reach out to recruiters and hiring managers to secure referrals.",
    content: (
      <div className="space-y-3.5 text-[13px] text-[#333333] leading-relaxed">
        <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-4">
          <p className="font-semibold text-[13.5px] text-[#111111] mb-1">1. Optimize Your Profile First</p>
          <p className="text-[#555555]">Ensure your headline contains target keywords (e.g. "Full-Stack Engineer | React, Node") and your About section tells a compelling career story.</p>
        </div>
        <div className="rounded-xl bg-[#F8F9FA] border-l-4 border-[#12A394] border-y border-r border-y-[#E9ECEF] border-r-[#E9ECEF] p-4">
          <p className="font-semibold text-[13px] text-[#111111] mb-1">2. Personalize Connection Requests</p>
          <p className="italic text-[12px] text-[#333333]">
            "Hi [Name], I noticed your profile and love the work you are doing at [Company]. I am a Software Engineer specializing in React and would love to connect to follow your updates."
          </p>
        </div>
        <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-4">
          <p className="font-semibold text-[13.5px] text-[#111111] mb-1">3. Ask for Advice, Not a Job</p>
          <p className="text-[#555555]">Ask for a 10-minute informational coffee chat to learn about their career journey. People love sharing their stories.</p>
        </div>
      </div>
    )
  },
  "sprint-strategy": {
    title: "Job Search Sprint Strategy",
    description: "Organize your job search to maximize results and minimize burnout.",
    content: (
      <div className="space-y-3.5 text-[13px] text-[#333333] leading-relaxed">
        <p className="text-[#444444]">Treat your job search like an agile sprint with structured weekly blocks:</p>
        <div className="space-y-2">
          <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-3 flex items-start gap-3">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#12A394] bg-[#12A394]/10 px-2 py-0.5 rounded shrink-0 mt-0.5">Mon</span>
            <span className="text-[#555555] text-[12.5px]"><strong>Sourcing:</strong> Find and bookmark 10 target roles in your Job Tracker. Do not apply yet.</span>
          </div>
          <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-3 flex items-start gap-3">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#12A394] bg-[#12A394]/10 px-2 py-0.5 rounded shrink-0 mt-0.5">Tue-Wed</span>
            <span className="text-[#555555] text-[12.5px]"><strong>Tailoring &amp; Submitting:</strong> Use AI Resume Tailor to customize your CV and submit. Quality over quantity.</span>
          </div>
          <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-3 flex items-start gap-3">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#12A394] bg-[#12A394]/10 px-2 py-0.5 rounded shrink-0 mt-0.5">Thu</span>
            <span className="text-[#555555] text-[12.5px]"><strong>Outreach:</strong> Send personalized cold messages to hiring managers and recruiters.</span>
          </div>
          <div className="rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] p-3 flex items-start gap-3">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#12A394] bg-[#12A394]/10 px-2 py-0.5 rounded shrink-0 mt-0.5">Fri</span>
            <span className="text-[#555555] text-[12.5px]"><strong>Follow-ups:</strong> Follow up on pending applications and practice interview responses.</span>
          </div>
        </div>
      </div>
    )
  }
};
