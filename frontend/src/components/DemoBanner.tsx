import { useState, useEffect } from "react";
import { Sparkles, Clock, Lock, ArrowRight } from "lucide-react";

export function DemoBanner() {
  const [isDemo, setIsDemo] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const checkDemo = () => {
      const demoFlag = localStorage.getItem("outly_is_demo") === "true";
      setIsDemo(demoFlag);

      if (demoFlag) {
        let expTime: number | null = null;
        const savedExp = localStorage.getItem("outly_demo_expires_at");
        if (savedExp) {
          expTime = new Date(savedExp).getTime();
        } else {
          // Decode JWT if demoExpiresAt is stored in payload
          const token = localStorage.getItem("outly_token");
          if (token) {
            try {
              const base64Url = token.split(".")[1];
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              const payload = JSON.parse(window.atob(base64));
              if (payload.exp) {
                expTime = payload.exp * 1000;
              }
            } catch (_) {}
          }
        }

        if (expTime) {
          const diff = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
          setTimeLeft(diff);
        } else {
          // Default to 25 mins if not present
          setTimeLeft(25 * 60);
        }
      }
    };

    checkDemo();
    const interval = setInterval(checkDemo, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isDemo || timeLeft === null) return;

    if (timeLeft <= 0) {
      // Trigger expired modal
      window.dispatchEvent(
        new CustomEvent("outly_demo_modal", {
          detail: {
            code: "DEMO_EXPIRED",
            message: "Your 25-minute demo session has ended. Sign up with Google to continue!",
            isExpired: true,
          },
        })
      );
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isDemo, timeLeft]);

  if (!isDemo) return null;

  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 25;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  const openSignupModal = () => {
    window.dispatchEvent(
      new CustomEvent("outly_demo_modal", {
        detail: {
          code: "DEMO_BANNER_UPGRADE",
          message: "Sign up with Google to save your progress, unlock unlimited ATS resume scans, and automate cold outreach.",
          isExpired: false,
        },
      })
    );
  };

  return (
    <div className="w-full bg-[#1A1A1A] text-white border-b border-black/10 px-4 py-2 select-none z-[99] relative">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Left: Badge + Status */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2DC08D]/20 text-[#2DC08D] font-bold text-[10.5px] uppercase tracking-wider border border-[#2DC08D]/30">
            <Sparkles className="w-3 h-3 text-[#2DC08D]" />
            Demo Mode
          </span>
          <span className="hidden sm:inline text-white/70">
            You are browsing with temporary sample data.
          </span>
        </div>

        {/* Center/Right: Countdown timer + CTA */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 text-white/80 font-mono text-[11.5px] bg-white/10 px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{formattedTime} remaining</span>
          </div>

          <button
            type="button"
            onClick={openSignupModal}
            className="inline-flex items-center gap-1.5 bg-[#2DC08D] hover:bg-[#25a87b] text-black font-semibold text-[11.5px] px-3 py-1 rounded-full transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <span>Unlock Full Access</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
