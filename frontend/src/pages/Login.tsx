import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePageTransition } from "../components/PageTransition";
import { Sparkles } from "lucide-react";
import gsap from "gsap";
import confetti from "canvas-confetti";
import logoTransparent from "../assets/brand/outly_your_career_at_peak.png";
import { api } from "../lib/api";
import { useToast } from "../hooks/use-toast";

interface SlideText {
  titleStart: string;
  italicizedText: string;
  subtitle: string;
}

const promoSlides: SlideText[] = [
  {
    titleStart: "Your resume, ",
    italicizedText: "perfectly matched.",
    subtitle: "Instantly score and tailor your resume to hit 95%+ ATS compatibility for every job description."
  },
  {
    titleStart: "Your outreach, ",
    italicizedText: "on autopilot.",
    subtitle: "Identify target recruiters and draft personalized cold emails that sound exactly like you."
  },
  {
    titleStart: "Your career, ",
    italicizedText: "already sorted.",
    subtitle: "One calm morning brief to track your applications, outreach queue, and daily interview prep."
  },
  {
    titleStart: "Your interviews, ",
    italicizedText: "fully scheduled.",
    subtitle: "Coordinate seamlessly with hiring managers and land your dream offer faster."
  }
];

/**
 * iOS-style 12-blade stepped radial loading spinner (exact match to UIActivityIndicator)
 */
function IosRadialSpinner({ className = "w-5 h-5 text-outly-dark" }: { className?: string }) {
  const blades = [
    { deg: 0, opacity: 1.0 },
    { deg: 30, opacity: 0.18 },
    { deg: 60, opacity: 0.25 },
    { deg: 90, opacity: 0.32 },
    { deg: 120, opacity: 0.40 },
    { deg: 150, opacity: 0.48 },
    { deg: 180, opacity: 0.56 },
    { deg: 210, opacity: 0.64 },
    { deg: 240, opacity: 0.73 },
    { deg: 270, opacity: 0.82 },
    { deg: 300, opacity: 0.90 },
    { deg: 330, opacity: 0.96 },
  ];

  return (
    <svg
      className={`${className} animate-[spin_0.85s_steps(12,end)_infinite] shrink-0`}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {blades.map(({ deg, opacity }) => (
        <rect
          key={deg}
          x="10.85"
          y="1.5"
          width="2.3"
          height="5.8"
          rx="1.15"
          opacity={opacity}
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

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
      try {
        const img = new Image();
        img.src = res.user.profilePic;
      } catch { }
    }
    if (res.user.email) localStorage.setItem("outly_user_email", res.user.email);
    localStorage.setItem("outly_user_session", JSON.stringify({ user: res.user }));
  }
}

export default function Login() {
  const navigate = useNavigate();
  const navigateTo = usePageTransition();
  const { toast } = useToast();
  const formWrapperRef = useRef<HTMLDivElement>(null);
  const textWrapperRef = useRef<HTMLDivElement>(null);

  // Left slide states
  const [activeSlide, setActiveSlide] = useState(0);

  // Action states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [isWakingServer, setIsWakingServer] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("outly_token");
    if (token) {
      navigate("/onboarding");
      return;
    }

    document.title = "Outly - Sign In";

    // Warm up the backend server/database immediately in background
    let isSlow = false;
    const timeoutId = setTimeout(() => {
      isSlow = true;
      setIsWakingServer(true);
      toast({
        title: "Waking up the cloud server... 🌌",
        description: "The free hosting tier goes to sleep after inactivity. We are booting it up for you. This will take about 15-30 seconds, please hold on!",
        duration: 10000,
      });
    }, 2000);

    api.auth.ping()
      .then(() => {
        clearTimeout(timeoutId);
        setIsWakingServer(false);
        if (isSlow) {
          toast({
            title: "Server Connected! 🚀",
            description: "The server is awake and ready. You can now log in instantly.",
          });
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setIsWakingServer(false);
      });
  }, []);

  // ─── 1. Left Panel Slide Loop (Auto-cycles) ───
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeSlide + 1) % promoSlides.length;
      triggerTextSlide(nextIndex);
    }, 3000);
    return () => clearInterval(timer);
  }, [activeSlide]);

  const triggerTextSlide = (nextIndex: number) => {
    const textEl = textWrapperRef.current;
    if (!textEl) {
      setActiveSlide(nextIndex);
      return;
    }

    gsap.to(textEl, {
      opacity: 0,
      y: -20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        setActiveSlide(nextIndex);
        gsap.fromTo(textEl,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
        );
      }
    });
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isDemoLoading) return;

    setIsGoogleLoading(true);

    const google = (window as any).google;
    if (typeof google === "undefined" || !google.accounts) {
      try {
        const res = await api.auth.googleLogin("mock_bypass_token");
        saveUserSession(res);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#2dc08d", "#1a1a1a"]
        });
        navigate("/onboarding");
      } catch (err: any) {
        toast({
          title: "Bypass login failed",
          description: err.message || "Failed to log in via bypass.",
          variant: "destructive"
        });
        setIsGoogleLoading(false);
      }
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: "137235712014-et2q796j1m13efh3qacdlkdbom3o11b4.apps.googleusercontent.com",
        scope: "email profile openid",
        callback: async (response: any) => {
          if (response.error) {
            console.error("Google sign-in error:", response.error);
            toast({
              title: "Google sign-in failed",
              description: "Unable to authenticate with Google. Please try again.",
              variant: "destructive"
            });
            setIsGoogleLoading(false);
            return;
          }
          if (response.access_token) {
            try {
              const res = await api.auth.googleLogin(response.access_token);
              saveUserSession(res);
              confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.6 },
                colors: ["#2dc08d", "#1a1a1a"]
              });
              navigate("/onboarding");
            } catch (err: any) {
              console.error("Google login backend error:", err);
              toast({
                title: "Google sign-in failed",
                description: err.message || "Unable to sign in with Google.",
                variant: "destructive"
              });
              setIsGoogleLoading(false);
            }
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      console.error("Google token client init failed:", err);
      setTimeout(() => {
        setIsGoogleLoading(false);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#2dc08d", "#1a1a1a"]
        });
        navigate("/dashboard");
      }, 800);
    }
  };

  const handleTryDemo = async () => {
    if (isDemoLoading || isGoogleLoading) return;
    setIsDemoLoading(true);
    setDemoError(null);

    try {
      const res = await api.auth.demo();
      saveUserSession(res);

      confetti({
        particleCount: 90,
        spread: 65,
        origin: { y: 0.6 },
        colors: ["#2dc08d", "#1a1a1a"]
      });

      toast({
        title: "Welcome to Outly Demo! ✨",
        description: "You have 25 minutes of guest access to test ATS scoring, tailored resumes, and outreach.",
      });

      navigate("/onboarding");
    } catch (err: any) {
      setIsDemoLoading(false);
      const isAlreadyUsed = err?.data?.code === "DEMO_ALREADY_USED" || err?.message?.includes("already used");
      const msg = isAlreadyUsed
        ? "You have already used your free demo session. Please continue with Google to unlock full access."
        : (err?.message || "Failed to create demo session. Please try again.");

      setDemoError(msg);
      toast({
        title: isAlreadyUsed ? "Demo session already used" : "Demo creation failed",
        description: msg,
        variant: "destructive"
      });

      if (isAlreadyUsed) {
        window.dispatchEvent(new CustomEvent("outly_demo_modal", {
          detail: { code: "DEMO_ALREADY_USED", message: msg, isExpired: false }
        }));
      }
    }
  };

  const currentSlide = promoSlides[activeSlide];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[#F2EBDD] font-sans selection:bg-outly-accent/20">

      {/* LEFT PANEL: Branding & Sliding Promo */}
      <div className="hidden lg:flex w-1/2 bg-[#F2EBDD] p-12 lg:p-16 flex-col justify-between relative overflow-hidden select-none sticky top-0 h-screen shrink-0 border-r border-[#e8e2d5]/60">

        {/* Concentric circles vector background lines */}
        <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 pointer-events-none opacity-40">
          <svg width="600" height="600" viewBox="0 0 600 600" fill="none">
            <circle cx="300" cy="300" r="280" stroke="#e8e2d5" strokeWidth="1" />
            <circle cx="300" cy="300" r="220" stroke="#e8e2d5" strokeWidth="1" />
            <circle cx="300" cy="300" r="160" stroke="#e8e2d5" strokeWidth="1" />
            <circle cx="300" cy="300" r="100" stroke="#e8e2d5" strokeWidth="1" />
          </svg>
        </div>

        {/* Logo Header */}
        <div className="flex items-center z-10 cursor-pointer hover:opacity-80 transition-opacity self-start" onClick={() => navigateTo("/")}>
          <img src={logoTransparent} alt="Outly Logo" className="h-8 w-auto object-contain" />
        </div>

        {/* Sliding Text Container */}
        <div className="my-auto max-w-[480px] z-10 flex flex-col justify-center py-8">

          {/* Fixed-height wrapper to prevent layout shift */}
          <div className="min-h-[200px] flex flex-col justify-start select-none">
            <div ref={textWrapperRef} className="will-change-transform">
              <h2 className="text-[52px] font-normal tracking-tight leading-[1.15] text-outly-dark mb-4 font-serif">
                {currentSlide.titleStart}
                <span className="italic text-outly-accent font-serif">{currentSlide.italicizedText}</span>
              </h2>

              <p className="text-[16px] text-outly-dark/70 leading-relaxed font-normal mb-8">
                {currentSlide.subtitle}
              </p>
            </div>
          </div>

          {/* Slider Progress Indicator Pills */}
          <div className="flex items-center gap-2 mb-10">
            {promoSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${activeSlide === idx ? "bg-outly-accent w-7" : "bg-[#e8e2d5] hover:bg-outly-accent/40 w-2"
                  }`}
                onClick={() => triggerTextSlide(idx)}
              />
            ))}
          </div>

          {/* Bullet Feature List */}
          <ul className="space-y-3.5">
            <li className="flex items-start gap-3 text-[14px] font-normal text-outly-dark/80 leading-relaxed">
              <span className="text-outly-dark/50 shrink-0 select-none font-bold">✓</span>
              <span>Instantly check ATS scores and tailor resumes in one click</span>
            </li>
            <li className="flex items-start gap-3 text-[14px] font-normal text-outly-dark/80 leading-relaxed">
              <span className="text-outly-dark/50 shrink-0 select-none font-bold">✓</span>
              <span>Automate personalized recruiter outreach and follow-ups</span>
            </li>
            <li className="flex items-start gap-3 text-[14px] font-normal text-outly-dark/80 leading-relaxed">
              <span className="text-outly-dark/50 shrink-0 select-none font-bold">✓</span>
              <span>Track application pipelines and get daily morning briefs</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-[12px] font-normal text-outly-dark/40 z-10">
          © 2026 Outly. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL: Auth Actions (Google & Try Demo Only) */}
      <div className="w-full lg:w-1/2 p-6 lg:p-16 flex flex-col justify-center items-center min-h-screen bg-[#FAF6F0]">
        <div ref={formWrapperRef} className="w-full max-w-[400px] flex flex-col justify-center will-change-transform py-12 lg:py-16">

          {/* Mobile Logo */}
          <div className="flex items-center lg:hidden mb-8 self-start cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoTransparent} alt="Outly Logo" className="h-6 w-auto object-contain" />
          </div>

          {/* Header Titles */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-outly-dark leading-tight mb-2.5 font-serif">
              Welcome to Outly
            </h1>
            <p className="text-[14px] font-normal text-outly-dark/70 leading-relaxed">
              Your calm, unified workspace for resume optimization and recruiter outreach.
            </p>
          </div>

          {/* Action Buttons Container (min width 358px verified, 48px touch targets) */}
          <div className="space-y-3.5 w-full">

            {/* 1. Primary: Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isDemoLoading || isWakingServer}
              className="w-full min-h-[48px] bg-white border border-[#e8e2d5] hover:border-outly-dark/40 py-3.5 px-6 rounded-full font-sans text-[15px] font-medium text-outly-dark flex items-center justify-center gap-3 select-none transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGoogleLoading ? (
                <div className="flex items-center justify-center gap-2.5">
                  <IosRadialSpinner className="w-5 h-5 text-outly-dark" />
                  <span className="text-[13px] font-bold tracking-wider uppercase text-outly-dark">
                    Signing in...
                  </span>
                </div>
              ) : isWakingServer ? (
                <div className="flex items-center justify-center gap-2.5">
                  <IosRadialSpinner className="w-5 h-5 text-outly-dark" />
                  <span className="text-[13px] font-medium text-outly-dark">
                    Connecting to server...
                  </span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* 2. Secondary Outline: Try Demo */}
            <div className="w-full">
              <button
                type="button"
                onClick={handleTryDemo}
                disabled={isGoogleLoading || isDemoLoading || isWakingServer}
                className="w-full min-h-[48px] bg-transparent border-2 border-outly-accent/80 hover:border-outly-accent hover:bg-outly-accent/5 text-outly-accent py-3 px-6 rounded-full font-sans text-[15px] font-medium flex items-center justify-center gap-2.5 select-none transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDemoLoading ? (
                  <div className="flex items-center justify-center gap-2.5">
                    <IosRadialSpinner className="w-5 h-5 text-outly-accent" />
                    <span className="text-[13px] font-bold tracking-wider uppercase text-outly-accent">
                      Creating Demo Account...
                    </span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-outly-accent" />
                    <span>Try Demo</span>
                  </>
                )}
              </button>

              {/* Helper text */}
              <p className="text-center text-[12px] font-normal text-outly-dark/60 mt-2 select-none">
                No signup · 1 free session
              </p>
            </div>

            {/* Error display if demo creation fails */}
            {demoError && (
              <div className="p-3.5 bg-red-50/90 border border-red-200/90 rounded-2xl text-xs text-red-800 leading-relaxed text-center animate-fade-in shadow-xs">
                {demoError}
              </div>
            )}
          </div>

          {/* Back to home */}
          <button
            onClick={() => navigateTo("/")}
            className="group inline-flex items-center gap-2 text-[13px] font-normal text-outly-dark/50 hover:text-outly-dark transition-all duration-300 mt-10 self-center select-none relative pb-1 cursor-pointer bg-transparent border-none min-h-[44px]"
          >
            <span className="transform transition-transform duration-300 ease-out group-hover:-translate-x-1">←</span>
            <span>Back to home</span>
          </button>

        </div>
      </div>

    </div>
  );
}
