import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import gsap from "gsap";
import confetti from "canvas-confetti";
import logoTransparent from "../assets/brand/logo_transparent.png";

interface SlideText {
  titleStart: string;
  italicizedText: string;
  subtitle: string;
}

const promoSlides: SlideText[] = [
  {
    titleStart: "Your day, ",
    italicizedText: "already sorted.",
    subtitle: "Start each morning knowing exactly what needs your attention."
  },
  {
    titleStart: "Your inbox, ",
    italicizedText: "finally quiet.",
    subtitle: "AI triage cuts the noise so only what matters reaches you."
  },
  {
    titleStart: "Your focus, ",
    italicizedText: "finally back.",
    subtitle: "An assistant that handles the logistics while you do the thinking."
  },
  {
    titleStart: "Your week, ",
    italicizedText: "fully visible.",
    subtitle: "One calendar view to plan, schedule, and never double-book."
  }
];

export default function Login() {
  const navigate = useNavigate();
  const formWrapperRef = useRef<HTMLDivElement>(null);
  const textWrapperRef = useRef<HTMLDivElement>(null);

  // Auth Mode: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  
  // Left slide states
  const [activeSlide, setActiveSlide] = useState(0);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Outly - Sign In";

    // Load Google Identity Services script dynamically
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // ─── 1. Left Panel Slide Loop (Auto-cycles) ───
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeSlide + 1) % promoSlides.length;
      triggerTextSlide(nextIndex);
    }, 3000); // Changed to 3 seconds
    return () => clearInterval(timer);
  }, [activeSlide]);

  const triggerTextSlide = (nextIndex: number) => {
    const textEl = textWrapperRef.current;
    if (!textEl) {
      setActiveSlide(nextIndex);
      return;
    }

    // GSAP text transition: slide up and fade out, then slide up from bottom and fade in
    gsap.to(textEl, {
      opacity: 0,
      y: -20, // Slide up to exit
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        setActiveSlide(nextIndex);
        // Reset element position to bottom before sliding up to center
        gsap.fromTo(textEl,
          { opacity: 0, y: 20 }, // Start from below (bottom)
          { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" } // Slide up to center
        );
      }
    });
  };

  // ─── 2. Auth Mode Switch Transition (SignIn <-> SignUp) ───
  const handleToggleAuthMode = (mode: "signin" | "signup") => {
    if (isLoading || authMode === mode) return;

    const wrapper = formWrapperRef.current;
    if (!wrapper) {
      setAuthMode(mode);
      return;
    }

    // GSAP form transition: slide out sideways, switch mode, and slide in from opposite side
    const slideOutX = mode === "signup" ? -30 : 30;
    const slideInX = mode === "signup" ? 30 : -30;

    gsap.to(wrapper, {
      opacity: 0,
      x: slideOutX,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        setAuthMode(mode);
        // Clear fields
        setName("");
        setEmail("");
        setPassword("");
        setAgreeToTerms(false);
        setPasswordVisible(false);

        gsap.fromTo(wrapper,
          { opacity: 0, x: slideInX },
          { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
        );
      }
    });
  };

  // ─── 3. Submit Handlers ───
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "signup" && !agreeToTerms) return;
    if (!email || !password) return;

    setIsLoading(true);

    // Simulate server authentication delay
    setTimeout(() => {
      setIsLoading(false);
      // Fire celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#f23c5d", "#1a1a1a"]
      });
      // Redirect to protected dashboard workspace
      navigate("/dashboard");
    }, 1200);
  };

  const handleGoogleSignIn = () => {
    if (isLoading) return;

    const google = (window as any).google;
    if (typeof google === "undefined" || !google.accounts) {
      console.warn("Google Identity Services not loaded yet. Falling back to simulated login.");
      // Fallback if script not loaded yet
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#f23c5d", "#1a1a1a"]
        });
        navigate("/dashboard");
      }, 1000);
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: "137235712014-et2q796j1m13efh3qacdlkdbom3o11b4.apps.googleusercontent.com",
        scope: "email profile openid",
        callback: (response: any) => {
          if (response.error) {
            console.error("Google sign-in error:", response.error);
            return;
          }
          if (response.access_token) {
            setIsLoading(true);
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
              colors: ["#f23c5d", "#1a1a1a"]
            });
            navigate("/dashboard");
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      console.error("Google token client init failed:", err);
      // Fallback to simulated login if there is an initialization error
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#f23c5d", "#1a1a1a"]
        });
        navigate("/dashboard");
      }, 1000);
    }
  };

  const currentSlide = promoSlides[activeSlide];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white overflow-hidden">
      
      {/* LEFT PANEL: Branding & Sliding Promo (Static Bullets at bottom) */}
      <div className="hidden lg:flex w-1/2 bg-[#fdfaf3] border-r border-[#e8e2d5] p-16 flex-col justify-between relative overflow-hidden select-none">
        
        {/* concentric circles vector background lines */}
        <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 pointer-events-none opacity-40">
          <svg width="600" height="600" viewBox="0 0 600 600" fill="none">
            <circle cx="300" cy="300" r="280" stroke="#e8e2d5" strokeWidth="1" />
            <circle cx="300" cy="300" r="220" stroke="#e8e2d5" strokeWidth="1" />
            <circle cx="300" cy="300" r="160" stroke="#e8e2d5" strokeWidth="1" />
            <circle cx="300" cy="300" r="100" stroke="#e8e2d5" strokeWidth="1" />
          </svg>
        </div>

        {/* Logo Header with subtle hover lift */}
        <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight z-10 cursor-pointer hover:opacity-80 transition-opacity self-start" onClick={() => navigate("/")}>
          <img src={logoTransparent} alt="Outly Logo" className="w-10 h-10 object-contain" />
          Outly
        </div>

        {/* Sliding Text Container (Only headings/subheadings change) */}
        <div className="my-auto max-w-[500px] z-10 flex flex-col justify-center">
          
          {/* Fixed-height wrapper to prevent layout shift and jitter */}
          <div className="h-[220px] flex flex-col justify-start select-none">
            <div ref={textWrapperRef} className="will-change-transform">
              <h2 className="text-[48px] font-serif font-medium tracking-tight leading-tight text-outly-dark mb-5 text-balance">
                {currentSlide.titleStart}
                <span className="italic-serif text-outly-accent">{currentSlide.italicizedText}</span>
              </h2>
              
              <p className="text-lg text-outly-dark/60 leading-relaxed font-medium mb-8">
                {currentSlide.subtitle}
              </p>
            </div>
          </div>

          {/* Slider Progress Indicator Pills (Spring-Bezier curves for bounce effect) */}
          <div className="flex items-center gap-2.5 mb-10">
            {promoSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`h-2.5 rounded-full transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) ${
                  activeSlide === idx ? "bg-outly-accent w-8" : "bg-[#e8e2d5] hover:bg-outly-accent/40 w-2.5"
                }`}
                onClick={() => triggerTextSlide(idx)}
              />
            ))}
          </div>

          {/* Static Bullet Feature List with interactive hover shifts */}
          <ul className="space-y-4">
            <li className="group flex items-start gap-3 text-[14px] font-bold text-outly-dark/70 leading-relaxed hover:translate-x-1.5 transition-transform duration-300">
              <span className="text-outly-dark/40 shrink-0 select-none group-hover:text-outly-accent transition-colors duration-300">✓</span>
              <span>Read, reply and triage Gmail without the noise</span>
            </li>
            <li className="group flex items-start gap-3 text-[14px] font-bold text-outly-dark/70 leading-relaxed hover:translate-x-1.5 transition-transform duration-300">
              <span className="text-outly-dark/40 shrink-0 select-none group-hover:text-outly-accent transition-colors duration-300">✓</span>
              <span>See your week and send invites in two clicks</span>
            </li>
            <li className="group flex items-start gap-3 text-[14px] font-bold text-outly-dark/70 leading-relaxed hover:translate-x-1.5 transition-transform duration-300">
              <span className="text-outly-dark/40 shrink-0 select-none group-hover:text-outly-accent transition-colors duration-300">✓</span>
              <span>Ask the assistant — "book us 30 minutes next Thursday"</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-xs font-bold text-outly-dark/20 uppercase tracking-widest z-10">
          © 2026 Outly
        </div>
      </div>

      {/* RIGHT PANEL: Auth Form (Pure white background) */}
      <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center items-center min-h-screen bg-white">
        <div ref={formWrapperRef} className="w-full max-w-[450px] flex flex-col justify-center will-change-transform">
          
          {/* Mobile Logo */}
          <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight lg:hidden mb-10 self-start" onClick={() => navigate("/")}>
            <img src={logoTransparent} alt="Outly Logo" className="w-8 h-8 object-contain" />
            Outly
          </div>

          {/* Form Header Titles */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-normal tracking-tight text-outly-dark leading-tight mb-2.5">
              {authMode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-[14px] font-medium text-outly-dark/40">
              {authMode === "signin" 
                ? "Sign in to your Outly workspace." 
                : "A calmer inbox is a minute away. Free to start."}
            </p>
          </div>

          {/* Google Sign-In (Clean outline pill button) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white border border-outly-dark/15 hover:border-outly-dark/35 py-3.5 px-7 rounded-full text-[14px] font-semibold text-outly-dark flex items-center justify-center gap-3 select-none mb-6 transition-all duration-200 hover:bg-outly-cream/15 active:bg-outly-cream/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6 select-none">
            <div className="h-px flex-1 bg-[#e8e2d5]"></div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-outly-dark/30">or with email</span>
            <div className="h-px flex-1 bg-[#e8e2d5]"></div>
          </div>

          {/* Credentials Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Name Field (Sign-Up Mode Only) */}
            {authMode === "signup" && (
              <div className="animate-slide-up">
                <label className="text-[12px] font-bold uppercase tracking-wider text-outly-dark/50 block mb-2 px-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digital labour"
                  className="w-full bg-[#faf8f5] border border-outly-border rounded-full py-3.5 px-6 text-[14px] font-semibold focus:bg-white focus:ring-1 focus:ring-outly-accent focus:border-outly-accent hover:border-outly-accent/40 outline-none transition-all duration-300 placeholder-outly-dark/20"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outly-dark/50 block mb-2 px-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="labour@company.com"
                className="w-full bg-[#faf8f5] border border-outly-border rounded-full py-3.5 px-6 text-[14px] font-semibold focus:bg-white focus:ring-1 focus:ring-outly-accent focus:border-outly-accent hover:border-outly-accent/40 outline-none transition-all duration-300 placeholder-outly-dark/20"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[12px] font-bold uppercase tracking-wider text-outly-dark/50 block mb-2 px-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === "signin" ? "••••••••" : "At least 8 characters"}
                  className="w-full bg-[#faf8f5] border border-outly-border rounded-full py-3.5 px-6 text-[14px] font-semibold focus:bg-white focus:ring-1 focus:ring-outly-accent focus:border-outly-accent hover:border-outly-accent/40 outline-none transition-all duration-300 placeholder-outly-dark/20 pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-outly-dark/30 hover:text-outly-dark transition-colors"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  disabled={isLoading}
                >
                  {passwordVisible ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox (Sign-Up Mode Only) */}
            {authMode === "signup" && (
              <div className="flex items-start gap-3 px-1 select-none animate-slide-up">
                <input
                  id="agree-terms-checkbox"
                  type="checkbox"
                  required
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 rounded border-outly-border text-outly-accent focus:ring-outly-accent cursor-pointer transition-colors"
                  disabled={isLoading}
                />
                <label htmlFor="agree-terms-checkbox" className="text-[12px] font-semibold text-outly-dark/50 leading-relaxed cursor-pointer">
                  I agree to the <span className="text-outly-accent font-bold hover:underline">Terms of Service</span> and <span className="text-outly-accent font-bold hover:underline">Privacy Policy</span>.
                </label>
              </div>
            )}

            {/* Submit Button (Glows and lifts smoothly) */}
            <button
              type="submit"
              className={`w-full bg-outly-accent text-white py-4 rounded-full text-[14px] font-bold transition-all duration-300 shadow-lg shadow-outly-accent/15 hover:shadow-xl hover:shadow-outly-accent/25 hover:scale-[1.01] active:scale-[0.99] select-none flex items-center justify-center gap-2.5 ${
                isLoading ? "opacity-85 pointer-events-none" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{authMode === "signin" ? "Signing in..." : "Creating account..."}</span>
                </>
              ) : (
                authMode === "signin" ? "Sign in" : "Create account"
              )}
            </button>
          </form>

          {/* Toggle auth mode links */}
          {authMode === "signin" ? (
            <p className="text-center text-[14px] font-bold text-outly-dark/40 mt-6 select-none">
              No account yet? &bull;{" "}
              <button
                type="button"
                className="text-outly-accent hover:underline font-bold transition-colors hover:text-outly-accent/80"
                onClick={() => handleToggleAuthMode("signup")}
                disabled={isLoading}
              >
                Sign up free
              </button>
            </p>
          ) : (
            <p className="text-center text-[14px] font-bold text-outly-dark/40 mt-6 select-none">
              Already have an account? &bull;{" "}
              <button
                type="button"
                className="text-outly-accent hover:underline font-bold transition-colors hover:text-outly-accent/80"
                onClick={() => handleToggleAuthMode("signin")}
                disabled={isLoading}
              >
                Sign in
              </button>
            </p>
          )}

          {/* Back to home (Smooth slide arrow and underline animation) */}
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-[14px] font-bold text-outly-dark/40 hover:text-outly-dark transition-all duration-300 mt-8 self-center select-none relative pb-1"
          >
            <span className="transform transition-transform duration-300 ease-out group-hover:-translate-x-1">←</span>
            <span>Back to home</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-outly-dark/40 transition-all duration-300 ease-out group-hover:w-full"></span>
          </Link>

        </div>
      </div>

    </div>
  );
}
