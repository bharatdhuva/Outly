import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Check } from "lucide-react";
import confetti from "canvas-confetti";
import logoTransparent from "../assets/brand/logo_transparent.png";

export default function Pricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [timeLeft, setTimeLeft] = useState("");
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("outly_premium_user") === "true");

  useEffect(() => {
    // 3 days in milliseconds
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    let targetTime = localStorage.getItem("outly_launch_offer_target");
    if (!targetTime) {
      const newTarget = Date.now() + THREE_DAYS_MS;
      localStorage.setItem("outly_launch_offer_target", newTarget.toString());
      targetTime = newTarget.toString();
    }

    const targetDate = parseInt(targetTime, 10);

    const updateTimer = () => {
      const now = Date.now();
      const difference = targetDate - now;

      if (difference <= 0) {
        const newTarget = Date.now() + THREE_DAYS_MS;
        localStorage.setItem("outly_launch_offer_target", newTarget.toString());
        setTimeLeft("3d 00h 00m 00s");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const pad = (num: number) => String(num).padStart(2, "0");

      setTimeLeft(`${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for custom premium upgrade events
  useEffect(() => {
    const checkPremiumStatus = () => {
      setIsPremium(localStorage.getItem("outly_premium_user") === "true");
    };
    window.addEventListener("storage", checkPremiumStatus);
    window.addEventListener("premium_upgrade", checkPremiumStatus);
    return () => {
      window.removeEventListener("storage", checkPremiumStatus);
      window.removeEventListener("premium_upgrade", checkPremiumStatus);
    };
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast({
        title: "Connection Error",
        description: "Failed to load Razorpay SDK. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }

    const amountInPaise = currency === "INR" ? 4900 : 8000; // ₹49 or $0.99 equivalent (~₹80)

    const options = {
      key: "rzp_test_mockkey12345",
      amount: amountInPaise,
      currency: "INR",
      name: "Outly",
      description: "Outly Cloud - One-Time Launch Offer",
      image: logoTransparent,
      handler: function (response: any) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        localStorage.setItem("outly_premium_user", "true");
        setIsPremium(true);
        window.dispatchEvent(new Event("premium_upgrade"));

        toast({
          title: "Upgrade Successful ✨",
          description: "Welcome to Outly Cloud! Your account has been upgraded.",
        });
      },
      prefill: {
        name: "Outly User",
        email: "user@example.com",
        contact: "9999999999"
      },
      theme: {
        color: "#fc2474"
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
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
      handleRazorpayPayment();
    }, 150);
  };

  const createParticle = (x: number, y: number) => {
    const particle = document.createElement("div");
    particle.className = "premium-particle";
    document.body.appendChild(particle);

    const size = Math.random() * 8 + 4;
    const colors = ["#8b5cf6", "#a78bfa", "#fc2474", "#c084fc", "#ddd6fe"];
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

  return (
    <div className="flex-1 py-6 px-4 max-w-5xl mx-auto flex flex-col items-center">


      {/* Pricing Cards Grid */}
      <div className="grid md:grid-cols-2 gap-10 items-stretch w-full max-w-4xl">

        {/* Outly Free Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-border flex flex-col hover:border-outly-accent/10 transition-all duration-300">
          <div className="mb-4">
            <span className="bg-muted text-muted-foreground text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">YOUR DATA IS OUR KEY</span>
          </div>
          <h3 className="text-2xl font-medium mb-2 tracking-tight">Outly Free</h3>
          <p className="text-[12px] text-muted-foreground mb-5">Complete privacy. Your data stays yours, and is never sold.</p>

          <div className="flex items-baseline gap-2 mb-5 select-none">
            <span className="text-5xl font-medium">₹0</span>
            <span className="text-muted-foreground text-xs font-medium">forever — you only pay your AI provider</span>
          </div>

          <ul className="space-y-3 mb-6 flex-1">
            <li className="flex items-center gap-3 text-xs text-foreground/80 font-semibold">
              <Check className="w-4 h-4 text-green-500 shrink-0" strokeWidth={3} />
              Basic Resume ATS Score checking
            </li>
            <li className="flex items-center gap-3 text-xs text-foreground/30 font-semibold line-through">
              <svg className="w-4 h-4 text-foreground/20 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Unlimited resume tailoring &amp; optimization
            </li>
            <li className="flex items-center gap-3 text-xs text-foreground/30 font-semibold line-through">
              <svg className="w-4 h-4 text-foreground/20 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Job search, tracking &amp; AI cold mail writing
            </li>
          </ul>

          <button
            disabled
            className="w-full border-2 border-border py-3 rounded-full font-bold text-sm text-muted-foreground bg-muted/25 cursor-default text-center select-none"
          >
            {isPremium ? "Free Plan" : "Current Plan"}
          </button>
        </div>

        {/* Outly Cloud Card (Midnight Navy Slate) */}
        <div className="bg-foreground rounded-[24px] p-6 text-white flex flex-col relative overflow-hidden shadow-xl shadow-outly-accent/5 border border-outly-accent/20 hover:shadow-outly-accent/15 transition-all duration-500">
          <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
            <span className="bg-outly-accent text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">SPECIAL LAUNCH OFFER</span>
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold px-3 py-1.5 rounded-full tracking-wider font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              <span>{timeLeft || "3d 00h 00m 00s"} LEFT</span>
            </span>
          </div>

          <h3 className="text-2xl font-medium mb-2 tracking-tight">Outly Cloud</h3>
          <p className="text-[12px] text-white/60 mb-5">No setup, no hassle. Outly Cloud tuned for speed — it just works.</p>

          <div className="flex items-baseline gap-2 mb-5 select-none">
            <span className="text-5xl font-medium">
              {currency === "INR" ? "₹49" : "$0.99"}
            </span>
            <span className="text-white/30 text-lg font-medium line-through leading-none">
              {currency === "INR" ? "₹299" : "$4.99"}
            </span>
            <span className="text-white/60 text-xs font-medium">
               one-time payment
            </span>
          </div>

          <ul className="space-y-3 mb-6 flex-1">
            <li className="flex items-center gap-3 text-xs text-white/90 font-semibold">
              <Check className="w-4 h-4 text-outly-accent shrink-0" strokeWidth={3} />
              Unlimited Resume Tailoring &amp; ATS Score Checking
            </li>
            <li className="flex items-center gap-3 text-xs text-white/90 font-semibold">
              <Check className="w-4 h-4 text-outly-accent shrink-0" strokeWidth={3} />
              AI Job Search &amp; Visual Job Tracker
            </li>
            <li className="flex items-center gap-3 text-xs text-white/90 font-semibold">
              <Check className="w-4 h-4 text-outly-accent shrink-0" strokeWidth={3} />
              LinkedIn &amp; Twitter Post Schedulers
            </li>
            <li className="flex items-center gap-3 text-xs text-white/90 font-semibold">
              <Check className="w-4 h-4 text-outly-accent shrink-0" strokeWidth={3} />
              AI Cold Mail Writer &amp; Automations
            </li>
            <li className="flex items-center gap-3 text-xs text-white/90 font-semibold">
              <Check className="w-4 h-4 text-outly-accent shrink-0" strokeWidth={3} />
              Get hired faster with AI — only ₹49
            </li>
          </ul>

          {isPremium ? (
            <div className="w-full bg-outly-accent/25 border border-outly-accent/30 py-3 rounded-full font-bold text-sm text-outly-accent select-none text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 fill-outly-accent/20" />
              Active Premium Plan
            </div>
          ) : (
            <button
              onClick={handleButtonClick}
              className="premium-upgrade-btn w-full py-3 px-5 gap-3 text-[#0b132b] flex items-center justify-center rounded-full shrink-0"
            >
              <div className="premium-sparkle-group w-6 h-6 shrink-0">
                <svg className="premium-sparkle-svg w-full h-full" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="card-btn-grad-top-left" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="card-btn-grad-top-right" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="card-btn-grad-bottom-right" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6d28d9" />
                      <stop offset="100%" stopColor="#4c1d95" />
                    </linearGradient>
                    <linearGradient id="card-btn-grad-bottom-left" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#5b21b6" />
                    </linearGradient>
                  </defs>

                  <g className="premium-small-sparkle-1">
                    <path d="M 80 25 L 80 15 C 80 21 77 25 71 25 Z" fill="url(#card-btn-grad-top-left)" />
                    <path d="M 80 25 L 89 25 C 83 25 80 21 80 15 Z" fill="url(#card-btn-grad-top-right)" />
                    <path d="M 80 25 L 80 35 C 80 29 83 25 89 25 Z" fill="url(#card-btn-grad-bottom-right)" />
                    <path d="M 80 25 L 71 25 C 77 25 80 29 80 35 Z" fill="url(#card-btn-grad-bottom-left)" />
                  </g>

                  <g className="premium-small-sparkle-2">
                    <path d="M 20 75 L 20 67 C 20 72 17 75 12 75 Z" fill="url(#card-btn-grad-top-left)" />
                    <path d="M 20 75 L 28 75 C 23 75 20 72 20 67 Z" fill="url(#card-btn-grad-top-right)" />
                    <path d="M 20 75 L 20 83 C 20 78 23 75 28 75 Z" fill="url(#card-btn-grad-bottom-right)" />
                    <path d="M 20 75 L 12 75 C 17 75 20 78 20 83 Z" fill="url(#card-btn-grad-bottom-left)" />
                  </g>

                  <g className="premium-main-sparkle">
                    <path d="M 50 50 L 50 10 C 50 32 32 50 10 50 Z" fill="url(#card-btn-grad-top-left)" />
                    <path d="M 50 50 L 90 50 C 68 50 50 32 50 10 Z" fill="url(#card-btn-grad-top-right)" />
                    <path d="M 50 50 L 50 90 C 50 68 68 50 90 50 Z" fill="url(#card-btn-grad-bottom-right)" />
                    <path d="M 50 50 L 10 50 C 32 50 50 68 50 90 Z" fill="url(#card-btn-grad-bottom-left)" />
                  </g>
                </svg>
              </div>

              <span className="text-[13px] font-bold tracking-wider uppercase text-[#0b132b]">Unlock Full Access</span>

              <svg className="premium-arrow-icon w-4 h-4 text-[#0b132b]" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          )}
        </div>

      </div>

      {/* Payment Trust & Security Footer (Centered Single-Column Stack) */}
      <div className="mt-10 w-full max-w-4xl border-t border-border/60 pt-6 flex flex-col items-center gap-4 select-none text-muted-foreground">
        
        {/* Row 1: Powered by Razorpay (Centered) */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/60">
          <span>Powered by</span>
          <svg className="h-5 w-24 text-[#0029FF] shrink-0" viewBox="0 0 100 24" fill="currentColor">
            <path d="M 4 20 L 12 4 L 18 4 L 10 20 Z" fill="#0029FF" />
            <path d="M 12 20 L 20 4 L 26 4 L 18 20 Z" fill="#00D2FF" opacity="0.8" />
            <text x="32" y="17" fill="#0b132b" fontSize="13" fontWeight="bold" fontFamily="sans-serif" letterSpacing="-0.2">Razorpay</text>
          </svg>
        </div>

        {/* Row 2: Payment Logos (Single Row, Centered, using Official Brand SVG logos via Wikimedia CDN) */}
        <div className="flex items-center justify-center gap-5.5 bg-white border border-border/50 py-3 px-6 rounded-2xl shadow-sm flex-wrap max-w-full">
          {/* UPI Logo */}
          <div className="flex items-center justify-center h-5 pr-3.5 border-r border-border/60 shrink-0">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" 
              alt="UPI" 
              className="h-4 w-auto object-contain shrink-0" 
            />
          </div>

          {/* GPay */}
          <div className="flex items-center justify-center h-5 shrink-0">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" 
              alt="Google Pay" 
              className="h-4 w-auto object-contain shrink-0" 
            />
          </div>

          {/* PhonePe */}
          <div className="flex items-center justify-center h-5 shrink-0">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/e1/PhonePe_Logo.svg" 
              alt="PhonePe" 
              className="h-4 w-auto object-contain shrink-0" 
            />
          </div>

          {/* Paytm */}
          <div className="flex items-center justify-center h-5 shrink-0">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo.svg" 
              alt="Paytm" 
              className="h-3 w-auto object-contain shrink-0" 
            />
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-border/60 mx-1 shrink-0"></div>

          {/* Visa */}
          <div className="flex items-center justify-center h-5 shrink-0">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" 
              alt="Visa" 
              className="h-2.5 w-auto object-contain shrink-0 opacity-85 hover:opacity-100 transition" 
            />
          </div>

          {/* Mastercard */}
          <div className="flex items-center justify-center h-5 shrink-0">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" 
              alt="Mastercard" 
              className="h-4 w-auto object-contain shrink-0 opacity-85 hover:opacity-100 transition" 
            />
          </div>

          {/* Maestro */}
          <div className="flex items-center justify-center h-5 shrink-0">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/f/fd/Maestro_logo.svg" 
              alt="Maestro" 
              className="h-4.5 w-auto object-contain shrink-0 opacity-85 hover:opacity-100 transition" 
            />
          </div>

          {/* Amex */}
          <div className="flex items-center justify-center h-5 shrink-0">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" 
              alt="American Express" 
              className="h-4.5 w-auto object-contain shrink-0 opacity-85 hover:opacity-100 transition" 
            />
          </div>

          {/* PayPal */}
          <div className="flex items-center justify-center w-8 h-5 shrink-0">
            <svg className="w-7 h-4.5 shrink-0 opacity-85 hover:opacity-100 transition" viewBox="0 0 24 24">
              <path d="M20.007 6.425C19.78 8.666 18.23 10.375 16 10.375H12.75L11.5 19H7.5L9.625 4.75h6.125c2.23 0 3.78 1.709 4.257 1.675z" fill="#003087" />
              <path d="M17.507 8.925C17.28 11.166 15.73 12.875 13.5 12.875H10.25L9 21.5H5L7.125 7.25h6.125c2.23 0 3.78 1.709 4.257 1.675z" fill="#0079C1" opacity="0.85" />
            </svg>
          </div>
        </div>

      </div>

    </div>
  );
}
