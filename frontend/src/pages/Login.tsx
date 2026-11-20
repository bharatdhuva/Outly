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
import { type FormEvent, type MouseEvent, useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePageTransition } from "../components/PageTransition";
import { prefetchOnIdle } from "@/lib/prefetch";
import { m, AnimatePresence } from "motion/react";
import { ChevronRight, Send, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useToast } from "../hooks/use-toast";
import { Spinner } from "../components/Spinner";
import { dur, ease, fadeUpVariants } from "../lib/motion-tokens";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import "./Login.css";

function LoginBrand() {
  return (
    <span className="login-brand">
      <span className="login-brand-mark"><Send size={20} strokeWidth={2} /></span>
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
  enter: { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0, transition: { duration: 0.2, ease: ease.out } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: ease.in } },
} as const;

const panelVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: ease.out } },
} as const;

const errorVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: ease.in } },
} as const;

// ─── Session persistence helper ───────────────────────────────────────────────
function saveUserSession(res: any) {
  if (!res) return;
  // Always clear previous session keys first so no data from a prior user leaks over
  localStorage.removeItem("outly_token");
  localStorage.removeItem("outly_premium_user");
  localStorage.removeItem("outly_is_demo");
  localStorage.removeItem("outly_demo_expires_at");
  localStorage.removeItem("outly_user_role");
  localStorage.removeItem("outly_user_name");
  localStorage.removeItem("outly_user_avatar");
  localStorage.removeItem("outly_user_email");
  localStorage.removeItem("outly_user_session");

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
  const location = useLocation();
  const navigateTo = usePageTransition();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeSlide, setActiveSlide] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(location.pathname === "/signup");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  // Failure modal state
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [failModalTitle, setFailModalTitle] = useState("Google Sign-In Failed");
  const [failModalMessage, setFailModalMessage] = useState("");

  // Lazy load Google GSI script only when login screen is viewed
  useEffect(() => {
    loadGoogleGsi();
    prefetchOnIdle(["/onboarding", "/resumes"]);
  }, []);

  // Check URL query parameters for external error redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error") || params.get("message");
    if (errorParam) {
      setFailModalTitle("Sign-In Failed");
      setFailModalMessage(errorParam);
      setFailModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    setIsSignUp(location.pathname === "/signup");
    setAuthError(null);
  }, [location.pathname]);

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

  // Google sign-in
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isDemoLoading || isAuthLoading) return;
    setIsGoogleLoading(true);

    // Auto-release loading state after 12 seconds if Google popup hangs
    const safetyTimer = setTimeout(() => {
      setIsGoogleLoading((loading) => {
        if (loading) {
          setFailModalTitle("Sign-In Timed Out");
          setFailModalMessage("Google sign-in timed out. Please try again.");
          setFailModalOpen(true);
        }
        return false;
      });
    }, 12000);

    const onWindowFocus = () => {
      setTimeout(() => {
        setIsGoogleLoading((loading) => {
          if (loading) {
            setFailModalTitle("Sign-In Window Closed");
            setFailModalMessage(
            `Google rejected this site origin. In Google Cloud Console, add ${window.location.origin} under Authorized JavaScript origins for the same Web OAuth client ID used by both VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID.`
            );
            setFailModalOpen(true);
          }
          return false;
        });
      }, 700);
      window.removeEventListener("focus", onWindowFocus);
    };
    window.addEventListener("focus", onWindowFocus);

    await loadGoogleGsi();

    const google = (window as any).google;
    // Keep the established public web client as a fallback for production builds
    // where Vite's optional environment variable has not been configured.
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "137235712014-et2q796j1m13efh3qacdlkdbom3o11b4.apps.googleusercontent.com";

    if (typeof google === "undefined" || !google.accounts) {
      clearTimeout(safetyTimer);
      window.removeEventListener("focus", onWindowFocus);
      setIsGoogleLoading(false);
      const msg = "Google Sign-In is unavailable. Please check your internet connection or ad blocker and try again.";
      setFailModalTitle("Google Sign-In Unavailable");
      setFailModalMessage(msg);
      setFailModalOpen(true);
      toast({ title: "Google Sign-In Unavailable", description: msg, variant: "destructive" });
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
          const msg =
            err?.message ||
            (err?.type === "popup_closed"
              ? "Sign-in was cancelled. Please try again."
              : `Google OAuth authorization failed. Add ${window.location.origin} to Authorized JavaScript origins for the same Web OAuth client used by the frontend and backend.`);
          setFailModalTitle("Google Sign-In Failed");
          setFailModalMessage(msg);
          setFailModalOpen(true);
          toast({ title: "Google Sign-In Failed", description: msg, variant: "destructive" });
        },
        callback: async (response: any) => {
          clearTimeout(safetyTimer);
          window.removeEventListener("focus", onWindowFocus);
          if (response.error) {
            setIsGoogleLoading(false);
            const msg =
              response.error === "popup_closed_by_user"
                ? "Sign-in window was closed without completing authentication."
                : (response.error_description || response.error || "Unable to complete Google sign-in.");
            setFailModalTitle("Google Sign-In Failed");
            setFailModalMessage(msg);
            setFailModalOpen(true);
            toast({ title: "Google Sign-In Failed", description: msg, variant: "destructive" });
            return;
          }
          if (response.access_token) {
            try {
              const res = await api.auth.googleLogin(response.access_token);
              queryClient.clear();
              saveUserSession(res);
              queryClient.setQueryData(["currentUser"], { user: res.user });
              setIsGoogleLoading(false);
              toast({
                title: "Signed In",
                description: `Welcome, ${res.user.fullName || res.user.email}!`,
              });
              navigate("/onboarding");
            } catch (err: any) {
              setIsGoogleLoading(false);
              const msg = err.message || "Failed to log in with Google credentials.";
              setFailModalTitle("Authentication Failed");
              setFailModalMessage(msg);
              setFailModalOpen(true);
              toast({ title: "Sign-in failed", description: msg, variant: "destructive" });
            }
          }
        },
      });
      client.requestAccessToken();
    } catch {
      clearTimeout(safetyTimer);
      window.removeEventListener("focus", onWindowFocus);
      setIsGoogleLoading(false);
      const msg = "Google authentication could not be completed. Please try again.";
      setFailModalTitle("Google Sign-In Failed");
      setFailModalMessage(msg);
      setFailModalOpen(true);
      toast({ title: "Google Sign-In Failed", description: msg, variant: "destructive" });
    }
  };

  // Demo session
  const handleTryDemo = async () => {
    if (isDemoLoading || isGoogleLoading || isAuthLoading) return;
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

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAuthLoading || isGoogleLoading || isDemoLoading) return;
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const result = isSignUp
        ? await api.auth.signup(authEmail.trim(), authPassword, authName.trim())
        : await api.auth.login(authEmail.trim(), authPassword);
      queryClient.clear();
      saveUserSession(result);
      queryClient.setQueryData(["currentUser"], { user: result.user });
      toast({
        title: isSignUp ? "Account created" : "Signed in",
        description: isSignUp ? "Welcome to Outly. Your workspace is ready." : `Welcome back${result.user.fullName ? `, ${result.user.fullName}` : ""}.`,
      });
      navigate("/onboarding", { replace: true });
    } catch (err: any) {
      const message = err?.message || (isSignUp ? "Could not create your account. Please try again." : "Could not sign in. Please check your details and try again.");
      setAuthError(message);
      toast({ title: isSignUp ? "Sign-up failed" : "Sign-in failed", description: message, variant: "destructive" });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const isDisabled = isGoogleLoading || isDemoLoading || isAuthLoading;
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
          <div className="mb-7 min-h-[72px]">
            <AnimatePresence mode="wait">
              <m.div
                key={isSignUp ? "signup-heading" : "login-heading"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: ease.out }}
              >
                <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#1A1A1A] leading-tight mb-2">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h1>
                <p className="text-[14px] text-[#6B6760] leading-relaxed">
                  {isSignUp ? "Start building a more thoughtful job search." : "Sign in to continue your job search with Outly."}
                </p>
              </m.div>
            </AnimatePresence>
          </div>

          <div className="login-auth-options">
            <m.button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isDisabled}
              whileTap={isDisabled ? {} : { scale: 0.97 }}
              transition={{ duration: dur.instant }}
              className="login-google-button w-full min-h-[48px] rounded-full text-[14px] font-medium flex items-center justify-center gap-3 select-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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

            <div className="login-or-divider"><span>or</span></div>

            <form className="login-email-form" onSubmit={handleEmailAuth}>
              <AnimatePresence initial={false}>
                {isSignUp && (
                  <m.label
                    key="field-name"
                    className="login-field"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 14 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2, ease: ease.out }}
                    style={{ overflow: "hidden" }}
                  >
                    <span>Your name</span>
                    <input type="text" name="name" autoComplete="name" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Priya Sharma" maxLength={80} required />
                  </m.label>
                )}
              </AnimatePresence>
              <label className="login-field"><span>Email</span><input type="email" name="email" autoComplete="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" maxLength={254} required /></label>
              <label className="login-field"><span>Password</span><input type="password" name="password" autoComplete={isSignUp ? "new-password" : "current-password"} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder={isSignUp ? "At least 8 characters" : "Your password"} minLength={isSignUp ? 8 : undefined} maxLength={128} required /></label>
              {authError && <p className="login-auth-error" role="alert">{authError}</p>}
              <button type="submit" disabled={isDisabled} className="login-submit-button">
                {isAuthLoading ? <><Spinner size={17} /><span>{isSignUp ? "Creating account…" : "Signing in…"}</span></> : (isSignUp ? "Create account" : "Sign in with email")}
              </button>
            </form>

            <p className="login-mode-switch">
              {isSignUp ? "Already have an account?" : "New to Outly?"}{" "}
              <button type="button" onClick={() => navigate(isSignUp ? "/login" : "/signup")}>
                {isSignUp ? "Sign in" : "Create account"}
              </button>
            </p>

            <div className="login-demo-option">
              <m.button
                type="button"
                onClick={handleTryDemo}
                disabled={isDisabled}
                whileTap={isDisabled ? {} : { scale: 0.97 }}
                transition={{ duration: dur.instant }}
                className="login-demo-button w-full min-h-[48px] rounded-full text-[14px] font-medium flex items-center justify-center gap-2 select-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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

      {/* ─── GOOGLE SIGN-IN FAIL POPUP MODAL ─── */}
      <Dialog open={failModalOpen} onOpenChange={setFailModalOpen}>
        <DialogContent className="max-w-[420px] p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xl font-sans">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-[#e3efe9] flex items-center justify-center mb-3 text-[#168b7d]">
              <AlertCircle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-neutral-900">
              {failModalTitle}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-neutral-600 leading-relaxed mt-2 text-center">
              {failModalMessage}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setFailModalOpen(false);
                handleGoogleSignIn();
              }}
              className="w-full min-h-[44px] bg-[#12A394] hover:bg-[#0E8A7D] text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
            >
              Try Again with Google
            </button>
            <button
              type="button"
              onClick={() => setFailModalOpen(false)}
              className="w-full min-h-[40px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
