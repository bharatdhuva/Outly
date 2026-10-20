import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowRight, Lock, Loader2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import logoTransparent from "../assets/brand/outly_your_career_at_peak.png";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Pricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("outly_premium_user") === "true");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

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
    if (isPremium) {
      toast({
        title: "Pro Already Active",
        description: "Your account is already upgraded to Outly Pro.",
      });
      return;
    }

    setIsProcessingPayment(true);
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      setIsProcessingPayment(false);
      toast({
        title: "Connection Error",
        description: "Failed to load payment gateway. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }

    let orderData;
    try {
      const amountInPaise = billingCycle === "monthly" ? 100 : 9900;
      orderData = await api.payment.createOrder(amountInPaise, "INR");
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
        description: "Payment gateway configuration missing. Please check back shortly.",
        variant: "destructive",
      });
      return;
    }

    const options = {
      key: razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Outly",
      description: `Outly Pro (${billingCycle === "monthly" ? "₹1 Monthly Trial" : "₹99 Yearly Trial"})`,
      image: logoTransparent,
      order_id: orderData.order_id,
      handler: async function (response: any) {
        try {
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
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 }
            });

            setShowSuccess(true);
          } else {
            toast({
              title: "Payment Verification Failed",
              description: verifyRes.message || "Payment verification failed.",
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
        color: "#121212"
      },
      modal: {
        ondismiss: function () {
          setIsProcessingPayment(false);
          toast({
            title: "Payment Cancelled",
            description: "You closed the payment window before finishing.",
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

  return (
    <div className="min-h-full w-full font-geist py-8 sm:py-12 px-4 sm:px-6 flex flex-col items-center justify-center animate-fade-in text-neutral-900 select-none">
      
      {/* ─── TOP BREADCRUMB ─── */}
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground text-center mb-3">
        Outly / Pricing
      </p>

      {/* ─── HERO HEADER ─── */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="text-4xl sm:text-[48px] md:text-[54px] font-bold text-neutral-900 tracking-[-0.035em] leading-[1.06]">
          A clearer way to move forward.
        </h1>
        <p className="text-[14px] sm:text-[15px] text-neutral-500 font-normal leading-relaxed max-w-md mx-auto pt-1">
          Tools for a more focused job search. Start free, then upgrade when you need more room.
        </p>
      </div>

      {/* ─── BILLING TOGGLE (PILL CAPSULE) ─── */}
      <div className="inline-flex items-center p-1 bg-white border border-neutral-200/90 rounded-full shadow-xs mx-auto mt-7">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
            billingCycle === "monthly"
              ? "bg-[#141414] text-white shadow-xs"
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <span>Monthly</span>
          <span className={`text-[10px] font-medium tracking-tight ${
            billingCycle === "monthly" ? "text-neutral-300" : "text-neutral-400"
          }`}>
            ₹1 trial
          </span>
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
            billingCycle === "yearly"
              ? "bg-[#141414] text-white shadow-xs"
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <span>Yearly</span>
          <span className={`text-[10px] font-medium tracking-tight ${
            billingCycle === "yearly" ? "text-neutral-300" : "text-neutral-400"
          }`}>
            ₹99 trial
          </span>
        </button>
      </div>

      {/* ─── PRICING CARDS GRID (2 CARDS) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[760px] mx-auto mt-8 items-stretch text-left">
        
        {/* ─── CARD 1: FREE ─── */}
        <div className="border border-neutral-200/80 bg-white rounded-[26px] p-7 sm:p-8 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all hover:border-neutral-300">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Free</h2>
            <p className="text-xs text-neutral-500 mt-2 min-h-[32px] leading-relaxed">
              A simple place to start building momentum.
            </p>

            {/* Price block */}
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-neutral-900 tracking-tight">₹0</span>
              <span className="text-xs text-neutral-400 font-normal ml-1">/ month</span>
            </div>
            <p className="text-[11.5px] text-neutral-400 mt-1 font-normal">no commitment</p>

            {/* Button */}
            <button
              disabled
              className="w-full border border-neutral-200 bg-white text-neutral-700 text-xs font-medium py-2.5 rounded-xl text-center shadow-2xs mt-6 cursor-default"
            >
              Current plan
            </button>

            {/* Divider */}
            <div className="border-t border-neutral-100 my-6" />

            {/* Includes list */}
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] mb-3.5">
              INCLUDES
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2.5 text-xs text-neutral-700 font-normal">
                <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" strokeWidth={2.5} />
                <span>Resume Vault</span>
              </li>
              <li className="flex items-center gap-2.5 text-xs text-neutral-700 font-normal">
                <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" strokeWidth={2.5} />
                <span>3 saved applications</span>
              </li>
              <li className="flex items-center gap-2.5 text-xs text-neutral-700 font-normal">
                <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" strokeWidth={2.5} />
                <span>Basic resume checker</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── CARD 2: PRO ─── */}
        <div className="border border-neutral-300 bg-white rounded-[26px] p-7 sm:p-8 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative transition-all hover:border-neutral-400">
          <div>
            {/* Top Right Badge */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Pro</h2>
              <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-neutral-400 inline-block" />
                MOST CHOSEN
              </span>
            </div>

            <p className="text-xs text-neutral-500 mt-2 min-h-[32px] leading-relaxed">
              Everything you need to apply with intention.
            </p>

            {/* Price block */}
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-neutral-900 tracking-tight">
                {billingCycle === "yearly" ? "₹99" : "₹1"}
              </span>
              <span className="text-xs text-neutral-400 font-normal ml-1">
                {billingCycle === "yearly" ? "/ year trial" : "/ month trial"}
              </span>
            </div>
            <p className="text-[11.5px] text-neutral-400 mt-1 font-normal">
              {billingCycle === "yearly" ? "special ₹99 yearly trial" : "special ₹1 monthly trial"}
            </p>

            {/* Start Pro CTA Button */}
            <button
              onClick={handleRazorpayPayment}
              disabled={isProcessingPayment}
              className="w-full bg-[#121212] hover:bg-black text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm mt-6 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-85"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isPremium ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Active Pro Plan</span>
                </>
              ) : (
                <>
                  <span>{billingCycle === "yearly" ? "Start Pro (₹99 Trial)" : "Start Pro (₹1 Trial)"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="border-t border-neutral-100 my-6" />

            {/* Includes list */}
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] mb-3.5">
              INCLUDES
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2.5 text-xs text-neutral-700 font-normal">
                <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" strokeWidth={2.5} />
                <span>Unlimited applications</span>
              </li>
              <li className="flex items-center gap-2.5 text-xs text-neutral-700 font-normal">
                <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" strokeWidth={2.5} />
                <span>Unlimited resume versions</span>
              </li>
              <li className="flex items-center gap-2.5 text-xs text-neutral-700 font-normal">
                <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" strokeWidth={2.5} />
                <span>ATS score &amp; keyword insights</span>
              </li>
              <li className="flex items-center gap-2.5 text-xs text-neutral-700 font-normal">
                <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" strokeWidth={2.5} />
                <span>Resume tailoring</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* ─── BOTTOM BANNER: NOT SURE WHERE TO START? ─── */}
      <div className="w-full max-w-[760px] mx-auto mt-14 pt-8 border-t border-neutral-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
        <div>
          <h3 className="text-base sm:text-[17px] font-bold text-neutral-900 tracking-tight">
            Not sure where to start?
          </h3>
          <p className="text-xs text-neutral-500 font-normal mt-0.5">
            Start free. Upgrade when your search deserves more room.
          </p>
        </div>

        <button
          onClick={() => setShowCompare(true)}
          className="text-xs font-semibold text-neutral-900 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Compare plans</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── FOOTER ─── */}
      <div className="w-full max-w-[760px] mx-auto mt-12 pt-6 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400 font-normal">
        <span>© 2026 Outly</span>
        <span className="flex items-center gap-1.5 text-neutral-400">
          <Lock className="w-3 h-3 text-neutral-400" />
          <span>Your data stays private</span>
        </span>
      </div>

      {/* ─── PAYMENT SUCCESS MODAL ─── */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[90%] max-w-[360px] bg-white p-6 shadow-2xl rounded-2xl border border-neutral-200 select-none text-center flex flex-col items-center font-geist">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Payment Successful</h2>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
            Thank you! Your account has been upgraded to Outly Pro with unlimited access.
          </p>
        </DialogContent>
      </Dialog>

      {/* ─── COMPARE PLANS MODAL ─── */}
      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] max-w-[560px] bg-white p-6 shadow-2xl rounded-2xl border border-neutral-200 font-geist text-left">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-neutral-900">Compare Plans</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              See what is included with Free and Pro.
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-neutral-100 text-xs mt-4">
            <div className="grid grid-cols-3 py-2 font-bold text-neutral-400 uppercase tracking-wider text-[10px]">
              <span>Feature</span>
              <span className="text-center">Free</span>
              <span className="text-center text-neutral-900 font-bold">Pro</span>
            </div>

            <div className="grid grid-cols-3 py-2.5 text-neutral-700">
              <span>Resume Versions</span>
              <span className="text-center text-neutral-500">1 active</span>
              <span className="text-center font-semibold text-neutral-900">Unlimited</span>
            </div>

            <div className="grid grid-cols-3 py-2.5 text-neutral-700">
              <span>Job Tracker</span>
              <span className="text-center text-neutral-500">3 applications</span>
              <span className="text-center font-semibold text-neutral-900">Unlimited</span>
            </div>

            <div className="grid grid-cols-3 py-2.5 text-neutral-700">
              <span>ATS Score Checks</span>
              <span className="text-center text-neutral-500">3 free checks</span>
              <span className="text-center font-semibold text-neutral-900">Unlimited</span>
            </div>

            <div className="grid grid-cols-3 py-2.5 text-neutral-700">
              <span>AI Resume Tailoring</span>
              <span className="text-center text-neutral-500">3 trial tailorings</span>
              <span className="text-center font-semibold text-neutral-900">Unlimited</span>
            </div>

            <div className="grid grid-cols-3 py-2.5 text-neutral-700">
              <span>Data Privacy</span>
              <span className="text-center font-medium text-emerald-600">Private</span>
              <span className="text-center font-medium text-emerald-600">Private</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
