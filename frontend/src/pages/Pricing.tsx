import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Check, Info, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import logoTransparent from "../assets/brand/logo_transparent.png";
import { api } from "@/lib/api";

export default function Pricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState("");
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("outly_premium_user") === "true");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);



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
    setIsProcessingPayment(true);
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      setIsProcessingPayment(false);
      toast({
        title: "Connection Error",
        description: "Failed to load Razorpay SDK. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }

    let orderData;
    try {
      // 1. Create order on backend
      orderData = await api.payment.createOrder(100, "INR");
    } catch (err: any) {
      setIsProcessingPayment(false);
      toast({
        title: "Order Creation Failed",
        description: err?.message || "Could not create payment order. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const razorpayKeyId = orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      setIsProcessingPayment(false);
      toast({
        title: "Configuration Error",
        description: "Razorpay Key ID is missing. Please set VITE_RAZORPAY_KEY_ID in environment variables.",
        variant: "destructive",
      });
      return;
    }

    // 2. Open Razorpay Checkout Modal
    const options = {
      key: razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Outly",
      description: "Outly Cloud - One-Time Launch Offer",
      image: logoTransparent,
      order_id: orderData.order_id,
      handler: async function (response: any) {
        try {
          // 3. Verify payment signature on backend
          const verifyRes = await api.payment.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verifyRes.success) {
            if (verifyRes.token) {
              localStorage.setItem("outly_token", verifyRes.token);
            }
            localStorage.setItem("outly_premium_user", "true");
            setIsPremium(true);
            window.dispatchEvent(new Event("premium_upgrade"));

            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });

            toast({
              title: "Upgrade Successful ✨",
              description: "Welcome to Outly Cloud! Your account has been upgraded.",
            });
          } else {
            toast({
              title: "Payment Verification Failed",
              description: verifyRes.message || "Payment signature verification failed.",
              variant: "destructive",
            });
          }
        } catch (err: any) {
          toast({
            title: "Verification Error",
            description: err?.message || "Failed to verify payment with server.",
            variant: "destructive",
          });
        } finally {
          setIsProcessingPayment(false);
        }
      },
      prefill: {
        name: "Outly User",
        email: "user@example.com",
      },
      theme: {
        color: "#2dc08d"
      },
      modal: {
        ondismiss: function () {
          setIsProcessingPayment(false);
          toast({
            title: "Payment Cancelled",
            description: "You closed the payment checkout before completing.",
          });
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on("payment.failed", function (response: any) {
      setIsProcessingPayment(false);
      toast({
        title: "Payment Failed",
        description: response?.error?.description || "Your transaction could not be processed.",
        variant: "destructive",
      });
    });
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

  return (
    <div className="flex-1 py-4 md:py-6 px-4 max-w-5xl mx-auto flex flex-col items-center justify-center font-sans">

      {/* Page Header - Landing Page Hero Style */}
      <div className="text-center max-w-2xl mb-6 md:mb-8 select-none flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-3 text-foreground font-sans">
          Outly Cloud <span className="italic-serif text-outly-accent font-normal">Pricing</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          Choose the right plan for your job search. Run in the cloud with top speed and zero configuration.
        </p>
      </div>      {/* Pricing Cards Grid */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-stretch w-full max-w-3xl">

        {/* Outly Free Card */}
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-border flex flex-col hover:border-outly-accent/10 transition-all duration-300">
          <div className="mb-3">
            <span className="bg-muted text-muted-foreground text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">YOUR DATA IS OUR KEY</span>
          </div>
          <h3 className="text-xl md:text-2xl font-medium mb-1 tracking-tight font-sans">Outly <span className="italic-serif text-muted-foreground font-normal">Free</span></h3>
          <p className="text-xs text-muted-foreground mb-4">Complete privacy. Your data stays yours, and is never sold.</p>

          <div className="flex items-baseline gap-2 mb-4 select-none">
            <span className="text-4xl md:text-5xl font-bold">₹0</span>
            <span className="text-muted-foreground text-xs font-medium">forever — you only pay your AI provider</span>
          </div>

          <ul className="space-y-2.5 mb-6 flex-1">
            <li className="flex items-center gap-3 text-xs text-foreground/80 font-semibold">
              <Check className="w-4 h-4 text-green-500 shrink-0" strokeWidth={3} />
              Basic Resume ATS Score checking
            </li>
            <li className="flex items-center gap-3 text-xs text-foreground/30 font-semibold line-through">
              <svg className="w-4 h-4 text-foreground/20 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              Unlimited resume tailoring &amp; optimization
            </li>
            <li className="flex items-center gap-3 text-xs text-foreground/30 font-semibold line-through">
              <svg className="w-4 h-4 text-foreground/20 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              Job search, tracking &amp; AI cold mail writing
            </li>
          </ul>

          <button
            disabled
            className="w-full border-2 border-border py-2.5 rounded-full font-bold text-sm text-muted-foreground bg-muted/25 cursor-default text-center select-none"
          >
            {isPremium ? "Free Plan" : "Current Plan"}
          </button>
        </div>

        {/* Outly Cloud Card (Midnight Navy Slate) */}
        <div className="bg-foreground rounded-3xl p-5 md:p-6 text-white flex flex-col relative overflow-hidden shadow-xl shadow-outly-accent/5 border border-outly-accent/20 hover:shadow-outly-accent/15 transition-all duration-500">
          <div className="mb-3 flex flex-wrap gap-2 items-center justify-between">
            <span className="bg-outly-accent text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">SPECIAL LAUNCH OFFER</span>
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold px-3 py-1.5 rounded-full tracking-wider font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              <span>{timeLeft || "3d 00h 00m 00s"} LEFT</span>
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-medium mb-1 tracking-tight font-sans">Outly <span className="italic-serif text-outly-accent font-normal">Cloud</span></h3>
          <p className="text-xs text-white/60 mb-4">No setup, no hassle. Outly Cloud tuned for speed — it just works.</p>

          <div className="flex items-baseline gap-2.5 mb-4 select-none">
            <span className="text-4xl md:text-5xl font-bold">
              ₹1
            </span>
            <span className="text-white/30 text-sm md:text-base font-medium line-through leading-none">
              ₹99
            </span>
            <span className="text-white/60 text-xs font-medium">
              one-time fee
            </span>
          </div>

          <ul className="space-y-2.5 mb-6 flex-1">
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
              Get hired faster with AI — Lifetime access @ ₹1/-
            </li>
          </ul>

          {isPremium ? (
            <div className="w-full bg-outly-accent/25 border border-outly-accent/30 py-2.5 rounded-full font-bold text-sm text-outly-accent select-none text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 fill-outly-accent/20" />
              Active Premium Plan
            </div>
          ) : (
            <button
              onClick={handleRazorpayPayment}
              disabled={isProcessingPayment}
              className="w-full bg-outly-accent py-2.5 rounded-full font-bold text-sm hover:brightness-110 transition shadow-lg shadow-outly-accent/20 text-center select-none cursor-pointer text-white flex items-center justify-center gap-2 disabled:opacity-80"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Processing your order...</span>
                </>
              ) : (
                <span>Get Lifetime Access @ ₹1/-</span>
              )}
            </button>
          )}
        </div>

      </div>

      {/* ℹ️ SYSTEM SCALABILITY TESTING NOTICE */}
      <div className="mt-8 p-3.5 rounded-2xl bg-secondary/30 border border-border/50 max-w-lg mx-auto text-center flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
        <Info className="w-4 h-4 text-outly-accent shrink-0" />
        <span>Note: ₹1 one-time launch pricing is currently active for project scalability &amp; live load testing.</span>
      </div>

    </div>
  );
}
