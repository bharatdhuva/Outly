import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, Check, ArrowRight, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import logoTransparent from "@/assets/brand/logo_transparent.png";
import confetti from "canvas-confetti";

const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function LockedFeatureGuard({
  featureTitle,
  description,
  children,
}: {
  featureTitle: string;
  description?: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("outly_premium_user") === "true";
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      setIsPremium(localStorage.getItem("outly_premium_user") === "true");
    };
    window.addEventListener("storage", checkStatus);
    window.addEventListener("premium_upgrade", checkStatus);
    return () => {
      window.removeEventListener("storage", checkStatus);
      window.removeEventListener("premium_upgrade", checkStatus);
    };
  }, []);

  const handleRazorpayPayment = async () => {
    try {
      setIsProcessingPayment(true);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast({
          title: "Connection Error",
          description: "Failed to load Razorpay SDK. Please check your internet connection.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
        return;
      }

      let orderData;
      try {
        orderData = await api.payment.createOrder(4900, "INR");
      } catch (err: any) {
        toast({
          title: "Order Creation Failed",
          description: err?.message || "Could not create payment order. Please try again.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
        return;
      }

      const razorpayKeyId = orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        toast({
          title: "Configuration Error",
          description: "Razorpay Key ID is missing. Redirecting to Pricing page...",
        });
        navigate("/pricing");
        setIsProcessingPayment(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Outly",
        description: `Unlock ${featureTitle} - Outly Cloud Plan`,
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
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });

              toast({
                title: "Upgrade Successful ✨",
                description: `Welcome to Outly Cloud! ${featureTitle} is now fully unlocked.`,
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
          name: "Outly Member",
        },
        theme: {
          color: "#2dc08d",
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            toast({
              title: "Payment Cancelled",
              description: "You closed the payment checkout before completing.",
            });
          },
        },
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
    } catch (e) {
      setIsProcessingPayment(false);
    }
  };

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full min-h-[600px] flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in">
      {/* Blurred background preview of the page content */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none blur-md select-none">
        {children}
      </div>

      {/* High-Converting Pro Feature Locked Modal Card */}
      <div className="relative z-20 mx-auto max-w-xl w-full rounded-3xl border border-primary/40 bg-card/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        
        {/* Soft Ambient Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full bg-primary/20 blur-2xl pointer-events-none" />

        {/* Lock Icon Badge */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 text-primary shadow-inner">
          <Lock className="h-10 w-10 stroke-[2.2]" />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-extrabold uppercase tracking-wider">
            <Zap className="h-3.5 w-3.5" /> PRO AUTOMATION MODULE LOCKED
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Unlock Full Access to {featureTitle}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {description || `This feature requires an active Outly Cloud Plan. Pay & upgrade via Razorpay to unlock automated cold emailing, job search algorithms, and application tracking on autopilot!`}
          </p>
        </div>

        {/* Value Checklist */}
        <div className="rounded-2xl bg-secondary/30 border border-border/60 p-4 text-left space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </div>
            <span>Unlimited Automated Cold Mail & Recruiter Outreach</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </div>
            <span>Real-Time Job Match Finder & Auto-Tracker</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </div>
            <span>Verified Recruiter Email Discovery & Priority AI Queue</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={handleRazorpayPayment}
            disabled={isProcessingPayment}
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:brightness-110 rounded-full px-8 py-3.5 font-extrabold text-sm h-12 shadow-lg shadow-primary/25 cursor-pointer transition-all active:scale-[0.98]"
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Pay & Unlock via Razorpay (₹49/mo)</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/pricing")}
            className="w-full sm:w-auto gap-1.5 rounded-full px-6 py-3.5 font-semibold text-xs h-12 border-border text-foreground hover:bg-secondary cursor-pointer"
          >
            <span>View Pricing Plans</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/80 flex items-center justify-center gap-1">
          <span>🔒 256-Bit Encrypted Secure Razorpay Checkout</span>
        </p>
      </div>
    </div>
  );
}
