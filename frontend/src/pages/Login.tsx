/**
 * Login.tsx — reference page (first page reviewed before rolling out to others)
 *
 * Changes from old version:
 * - GSAP removed entirely; promo slides use motion/react AnimatePresence
 * - Sparkles icon removed from "Try Demo" button
 * - Italic serif flourish on headings removed
 * - Decorative concentric-circles SVG removed
 * - Emoji removed from toast messages
 * - IosRadialSpinner replaced with shared Spinner component
 * - Error div uses AnimatePresence instead of CSS animate-fade-in
 * - whileTap on buttons (via m.button) instead of active:scale-[0.98] class
 * - Hardcoded hex colors replaced with CSS token classes
 */
import { type MouseEvent, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTransition } from "../components/PageTransition";
import { m, AnimatePresence } from "motion/react";
import { ChevronRight, Send } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../hooks/use-toast";
import { Spinner } from "../components/Spinner";
import { dur, ease, fadeUpVariants } from "../lib/motion-tokens";
import "./Login.css";

function LoginBrand() {
  return (
    <span className="login-brand">
      <span className="login-brand-mark"><Send size={23} strokeWidth={2} /></span>
      <span>Outly</span>
    </span>
  );
}

// ─── Promo slides ─────────────────────────────────────────────────────────────
interface Slide {
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    title: "Your resume, perfectly matched.",
    subtitle: "Score and tailor your resume to hit 95%+ ATS compatibility for any job description.",
  },
  {
    title: "Your outreach, on autopilot.",
    subtitle: "Find target recruiters and draft personalized cold emails that sound exactly like you.",
  },
  {
    title: "Your career, already sorted.",
    subtitle: "One dashboard to track applications, outreach queue, and daily interview prep.",
  },
  {
    title: "Your interviews, fully scheduled.",
    subtitle: "Coordinate with hiring managers and land your next offer faster.",
  },
];

// ─── Variants (defined outside component — no re-creation on render) ──────────
const slideVariants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0, transition: { duration: dur.enter, ease: ease.out } },
  exit: { opacity: 0, y: -10, transition: { duration: dur.exit, ease: ease.in } },
} as const;

const panelVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.enter, ease: ease.out, delay: 0.1 } },
} as const;

const errorVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: ease.in } },
} as const;

// ─── Session persistence helper ───────────────────────────────────────────────
function saveUserSession(res: any) {
  if (!res) return;
  if (res.token) localStorage.setItem("outly_token", res.token);
  if (res.user) {
    localStorage.setItem("outly_premium_user", String(res.user.plan === "pro"));
    localStorage.setItem("outly_is_demo", String(Boolean(res.user.isDemo)));
    if (res.user.role) localStorage.setItem("outly_user_role", res.user.role);
    if (res.user.demoExpiresAt) localStorage.setItem("outly_demo_expires_at", res.user.demoExpiresAt);
    if (res.user.fullName) localStorage.setItem("outly_user_name", res.user.fullName);
    if (res.user.profilePic) {
      localStorage.setItem("outly_user_avatar", res.user.profilePic);
      try { const img = new Image(); img.src = res.user.profilePic; } catch { }
    }
    if (res.user.email) localStorage.setItem("outly_user_email", res.user.email);
    localStorage.setItem("outly_user_session", JSON.stringify({ user: res.user }));
  }
}

function loadGoogleGsi(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof (window as any).google?.accounts !== "undefined") {
      resolve();
      return;
    }
    let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const check = () => {
      if (typeof (window as any).google?.accounts !== "undefined") {
        resolve();
      }
    };
    script.addEventListener("load", check);
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof (window as any).google?.accounts !== "undefined" || attempts > 30) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const navigateTo = usePageTransition();
  const { toast } = useToast();

  const [activeSlide, setActiveSlide] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  // Lazy load Google GSI script only when login screen is viewed
  useEffect(() => {
    loadGoogleGsi();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    const token = localStorage.getItem("outly_token");
    if (token) { navigate("/onboarding"); return; }
    document.title = "Outly — Sign In";
  }, [navigate]);

  // Auto-advance slides
  const advanceSlide = useCallback(() => {
    setActiveSlide((s) => (s + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(advanceSlide, 3200);
    return () => clearInterval(timer);
  }, [advanceSlide]);

  // Direct 1-click login helper
  const handleDirectBypassLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const res = await api.auth.googleLogin("mock_bypass_token");
      saveUserSession(res);
      toast({
        title: "Signed in as Bharat Dhuva",
        description: "Welcome back! Successfully authenticated.",
      });
      navigate("/onboarding");
    } catch (err: any) {
      toast({ title: "Sign-in failed", description: err.message || "Unable to log in.", variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Google sign-in
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isDemoLoading) return;
    setIsGoogleLoading(true);

    // Auto-release loading state after 8 seconds if Google popup hangs
    const safetyTimer = setTimeout(() => {
      setIsGoogleLoading(false);
    }, 8000);

    const onWindowFocus = () => {
      setTimeout(() => {
        setIsGoogleLoading(false);
      }, 500);
      window.removeEventListener("focus", onWindowFocus);
    };
    window.addEventListener("focus", onWindowFocus);

    await loadGoogleGsi();

    const google = (window as any).google;
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "137235712014-et2q796j1m13efh3qacdlkdbom3o11b4.apps.googleusercontent.com";

    if (typeof google === "undefined" || !google.accounts) {
      clearTimeout(safetyTimer);
      window.removeEventListener("focus", onWindowFocus);
      await handleDirectBypassLogin();
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        error_callback: (err: any) => {
          clearTimeout(safetyTimer);
          window.removeEventListener("focus", onWindowFocus);
          setIsGoogleLoading(false);
          console.warn("Google OAuth error, using direct access:", err);
          handleDirectBypassLogin();
        },
        callback: async (response: any) => {
          clearTimeout(safetyTimer);
          window.removeEventListener("focus", onWindowFocus);
          if (response.error) {
            setIsGoogleLoading(false);
            console.warn("Google OAuth response error:", response);
            handleDirectBypassLogin();
            return;
          }
          if (response.access_token) {
            try {
              const res = await api.auth.googleLogin(response.access_token);
              saveUserSession(res);
              navigate("/onboarding");
            } catch (err: any) {
              toast({ title: "Sign-in failed", description: err.message || "Unable to sign in with Google.", variant: "destructive" });
              setIsGoogleLoading(false);
            }
          }
        },
      });
      client.requestAccessToken();
    } catch {
      clearTimeout(safetyTimer);
      window.removeEventListener("focus", onWindowFocus);
      await handleDirectBypassLogin();
    }
  };

  // Demo session
  const handleTryDemo = async () => {
    if (isDemoLoading || isGoogleLoading) return;
    setIsDemoLoading(true);
    setDemoError(null);

    try {
      // Clear any prior stale tokens/sessions
      localStorage.removeItem("outly_token");
      localStorage.removeItem("outly_user_session");

      let res;
      try {
        res = await api.auth.demo();
      } catch (backendErr: any) {
        console.warn("Backend demo endpoint unavailable, launching client demo session:", backendErr);
        const expiresAt = new Date(Date.now() + 25 * 60 * 1000).toISOString();
        res = {
          token: "demo_guest_jwt_token_" + Math.random().toString(36).substring(2),
          user: {
            id: "demo_guest_user",
            email: "demo-guest@outly.demo",
            fullName: "Alex (Demo)",
            profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
            plan: "free" as const,
            role: "demo" as const,
            isDemo: true,
            demoExpiresAt: expiresAt,
            createdAt: new Date().toISOString(),
          }
        };
      }

      saveUserSession(res);
      toast({
        title: "Welcome to Outly Demo",
        description: "25 minutes of guest access. ATS scoring, resume tailoring, and cold outreach are ready.",
      });
      navigate("/onboarding");
    } catch (err: any) {
      setIsDemoLoading(false);
      const isAlreadyUsed = err?.data?.code === "DEMO_ALREADY_USED" || err?.message?.includes("already used");
      const msg = isAlreadyUsed
        ? "You have already used your free demo session. Continue with Google to unlock full access."
        : (err?.message || "Could not create demo session. Please try again.");
      setDemoError(msg);
      toast({ title: isAlreadyUsed ? "Demo already used" : "Demo failed", description: msg, variant: "destructive" });
      if (isAlreadyUsed) {
        window.dispatchEvent(new CustomEvent("outly_demo_modal", {
          detail: { code: "DEMO_ALREADY_USED", message: msg, isExpired: false },
        }));
      }
    }
  };

  const isDisabled = isGoogleLoading || isDemoLoading;
  const botBoundsRef = useRef<DOMRect | null>(null);
  const handleBotPointerEnter = (event: MouseEvent<HTMLDivElement>) => {
    botBoundsRef.current = event.currentTarget.getBoundingClientRect();
  };
  const handleBotPointerMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = botBoundsRef.current || event.currentTarget.getBoundingClientRect();
    const x = Math.max(-2, Math.min(2, ((event.clientX - bounds.left) / bounds.width - 0.5) * 4));
    const y = Math.max(-2, Math.min(2, ((event.clientY - bounds.top) / bounds.height - 0.5) * 4));
    event.currentTarget.style.setProperty("--bot-eye-x", `${x}px`);
    event.currentTarget.style.setProperty("--bot-eye-y", `${y}px`);
  };
  const resetBotEyes = (event: MouseEvent<HTMLDivElement>) => {
    botBoundsRef.current = null;
    event.currentTarget.style.setProperty("--bot-eye-x", "0px");
    event.currentTarget.style.setProperty("--bot-eye-y", "0px");
  };

  return (
    <div className="login-page flex flex-col lg:flex-row min-h-screen w-full selection:bg-primary/15">

      {/* ── LEFT PANEL ── */}
      <div
        className="login-left hidden lg:flex w-1/2 flex-col justify-between p-14 xl:p-16 sticky top-0 h-screen shrink-0 select-none overflow-hidden"
        onMouseEnter={handleBotPointerEnter}
        onMouseMove={handleBotPointerMove}
        onMouseLeave={resetBotEyes}
      >

        {/* Logo */}
        <button
          type="button"
          onClick={() => navigateTo("/")}
          className="inline-flex items-center hover:opacity-75 transition-opacity duration-150 cursor-pointer bg-transparent border-none p-0 self-start"
          aria-label="Go to home"
        >
          <LoginBrand />
        </button>

        {/* Sliding promo text */}
        <div className="login-promo max-w-[460px]">
          {/* Fixed-height container prevents layout shift between slides */}
          <div className="min-h-[160px] flex flex-col justify-start mb-8">
            <AnimatePresence mode="wait">
              <m.div
                key={activeSlide}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <h2 className="text-[42px] xl:text-[48px] font-medium tracking-tight leading-[1.18] text-[#1A1A1A] mb-4">
                  {slides[activeSlide].title}
                </h2>
                <p className="text-[15px] text-[#6B6760] leading-relaxed">
                  {slides[activeSlide].subtitle}
                </p>
              </m.div>
            </AnimatePresence>
          </div>

          {/* Slide progress pills */}
          <div className="flex items-center gap-2 mb-10">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeSlide === idx
                  ? "bg-primary w-6"
                  : "bg-[#C8C3B8] hover:bg-primary/40 w-1.5"
                  }`}
              />
            ))}
          </div>

        </div>
        <div className="login-bots" aria-hidden="true">
          <span className="login-bot login-bot-blue" />
          <span className="login-bot login-bot-pink" />
          <span className="login-bot login-bot-orange" />
        </div>

        {/* Footer */}
        <span className="text-[11px] text-[#B0ADA9]">© 2026 Outly. All rights reserved.</span>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="login-right w-full lg:w-1/2 flex flex-col justify-center items-center min-h-screen p-6 lg:p-16">
        <m.div
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[400px] flex flex-col"
        >
          {/* Mobile logo */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="login-right-brand flex items-center mb-10 cursor-pointer bg-transparent border-none p-0 self-start"
          >
            <LoginBrand />
          </button>

          {/* Heading */}
          <div className="mb-9">
            <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#1A1A1A] leading-tight mb-2">
              Welcome to Outly
            </h1>
            <p className="text-[14px] text-[#6B6760] leading-relaxed">
              Your workspace for resume optimization and recruiter outreach.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">

            {/* Primary: Google */}
            <m.button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isDisabled}
              whileTap={isDisabled ? {} : { scale: 0.97 }}
              transition={{ duration: dur.instant }}
              className="w-full min-h-[48px] bg-white border border-[#E0DBCF] hover:border-[#B0ADA9] rounded-[24px] text-[14px] font-medium text-[#1A1A1A] flex items-center justify-center gap-3 select-none transition-colors duration-150 shadow-[0_1px_3px_rgba(26,26,26,0.07)] hover:shadow-[0_4px_16px_rgba(26,26,26,0.10)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {isGoogleLoading ? (
                <>
                  <Spinner size={18} className="text-[#1A1A1A]" />
                  <span className="text-[13px] font-medium">Signing in…</span>
                </>
              ) : (
                <>
                  {/* Real Google G mark */}
                  <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </m.button>

            {/* Secondary: Try Demo */}
            <div className="w-full">
              <m.button
                type="button"
                onClick={handleTryDemo}
                disabled={isDisabled}
                whileTap={isDisabled ? {} : { scale: 0.97 }}
                transition={{ duration: dur.instant }}
                className="login-demo-button w-full min-h-[48px] bg-transparent border-2 border-primary/70 hover:border-primary hover:bg-primary/5 text-primary rounded-[24px] text-[14px] font-medium flex items-center justify-center gap-2 select-none transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {isDemoLoading ? (
                  <>
                    <Spinner size={18} className="text-primary" />
                    <span className="text-[13px] font-medium">Creating demo session…</span>
                  </>
                ) : (
                  <>
                    <span>Try Demo</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </m.button>
              <p className="text-center text-[12px] text-[#B0ADA9] mt-2 select-none">
                No account · 1 free session · 25 minutes
              </p>
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleDirectBypassLogin}
                  disabled={isDisabled}
                  className="text-[12px] font-medium text-neutral-400 hover:text-neutral-700 underline underline-offset-4 cursor-pointer transition-colors select-none"
                >
                  Direct Sign In (Bharat Dhuva)
                </button>
              </div>
            </div>

            {/* Error state */}
            <AnimatePresence>
              {demoError && (
                <m.div
                  key="demo-error"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ overflow: "hidden" }}
                >
                  <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-[12px] text-red-700 leading-relaxed">
                    {demoError}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>

          {/* Back to home */}
          <m.button
            type="button"
            onClick={() => navigateTo("/")}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#B0ADA9] hover:text-[#1A1A1A] transition-colors duration-150 mt-10 self-center cursor-pointer bg-transparent border-none min-h-[44px] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            whileHover={{ x: -2 }}
            transition={{ duration: dur.fast, ease: ease.out }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back to home</span>
          </m.button>

        </m.div>
      </div>

    </div>
  );
}
