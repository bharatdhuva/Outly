import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Sparkles, Loader2, Check, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import logoTransparent from "@/assets/brand/outly_your_career_at_peak.png";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

export default function LimitReachedModal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const handleLimitExceeded = (e: Event) => {
      const customEvent = e as CustomEvent;
      const message = customEvent.detail?.message || "You have reached the free tier limit for this feature.";
      setLimitMessage(message);
      setShowSuccess(false);
      setOpen(true);
    };

    window.addEventListener("outly_limit_exceeded", handleLimitExceeded);
    return () => {
      window.removeEventListener("outly_limit_exceeded", handleLimitExceeded);
    };
  }, []);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setOpen(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Clear any lingering success state when the route changes to avoid
  // accidentally showing the payment animation on unrelated pages (e.g., Cold Mail).
  const location = useLocation();
  useEffect(() => {
    if (showSuccess) {
      setShowSuccess(false);
    }
    if (open) {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
        orderData = await api.payment.createOrder(100, "INR");
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
        setOpen(false);
        setIsProcessingPayment(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Outly",
        description: "Unlock Outly Lifetime Cloud Pro Plan",
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
              window.dispatchEvent(new Event("premium_upgrade"));

              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });

              setShowSuccess(true);
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

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!showSuccess) setOpen(val); }}>
      <DialogContent className="max-h-[85vh] sm:max-h-[90vh] overflow-y-auto w-[90%] max-w-[360px] sm:max-w-[440px] md:max-w-[580px] lg:max-w-[620px] select-none p-0 border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] rounded-[22px] md:rounded-[32px]">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center bg-white text-center gap-2.5 p-5 sm:p-7 md:p-10">
            <div className="w-11 h-11 md:w-16 md:h-16 rounded-2xl bg-[#2DC08D]/10 border border-[#2DC08D]/20 text-[#2DC08D] flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="h-5 w-5 md:h-8 md:w-8 text-[#2DC08D]" />
            </div>
            <DialogTitle className="text-lg md:text-2xl font-bold text-neutral-900 tracking-tight">Welcome to Cloud Pro! 🎉</DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-neutral-500 max-w-sm leading-relaxed">
              All features including unlimited ATS checks, AI resume tailoring, and deep factor analysis are now unlocked.
            </DialogDescription>
            <Button
              onClick={() => setOpen(false)}
              className="mt-2 bg-[#111111] hover:bg-black text-white rounded-xl text-xs md:text-sm font-semibold px-5 h-9 md:h-11 cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              Continue Scanning
            </Button>
          </div>
        ) : (
          <div className="relative bg-white p-4 sm:p-6 md:p-8 text-center flex flex-col">
            {/* Lock / Security Badge */}
            <div className="mx-auto flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl bg-[#2DC08D]/10 border border-[#2DC08D]/20 text-[#2DC08D] mt-1 shadow-sm">
              <Lock className="h-4 w-4 md:h-5 md:w-5 stroke-[2.2]" />
            </div>

            {/* Header / Title Details (free limit badge completely removed as requested) */}
            <div className="space-y-1 md:space-y-1.5 text-center mt-2.5 md:mt-3">
              <DialogTitle className="text-lg sm:text-xl md:text-[25px] font-bold md:font-extrabold text-neutral-900 tracking-tight">
                Unlock Unlimited Scans
              </DialogTitle>
              <DialogDescription className="text-xs md:text-[13px] text-neutral-500 leading-relaxed px-1 max-w-md mx-auto">
                {limitMessage || "You've reached your free limit. Upgrade to Outly Pro for unlimited scans and AI tailoring."}
              </DialogDescription>
            </div>

            {/* Value Proposition: 1 column on mobile, 2 columns on laptop/desktop */}
            <div className="bg-neutral-50/80 border border-neutral-100 rounded-xl md:rounded-2xl p-2.5 sm:p-3.5 md:p-4 text-left my-2.5 md:my-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-x-4 md:gap-y-3">
                <div className="flex items-start gap-2 text-[11.5px] sm:text-xs md:text-[12.5px] text-neutral-700">
                  <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-[#2DC08D]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2 h-2 md:w-2.5 md:h-2.5 text-[#2DC08D] stroke-[2.5]" />
                  </div>
                  <span><strong>Unlimited ATS checks</strong> with 27-factor scoring</span>
                </div>
                <div className="flex items-start gap-2 text-[11.5px] sm:text-xs md:text-[12.5px] text-neutral-700">
                  <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-[#2DC08D]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-[#2DC08D] stroke-[2.5]" />
                  </div>
                  <span><strong>AI Resume Tailor</strong> for any target job description</span>
                </div>
                <div className="flex items-start gap-2 text-[11.5px] sm:text-xs md:text-[12.5px] text-neutral-700">
                  <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-[#2DC08D]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-[#2DC08D] stroke-[2.5]" />
                  </div>
                  <span><strong>Recruiter keyword gap</strong> engine &amp; fixes</span>
                </div>
                <div className="flex items-start gap-2 text-[11.5px] sm:text-xs md:text-[12.5px] text-neutral-700">
                  <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-[#2DC08D]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-[#2DC08D] stroke-[2.5]" />
                  </div>
                  <span><strong>Resume Vault</strong> with unlimited saved versions</span>
                </div>
              </div>
            </div>

            {/* Pricing Callout Banner */}
            <div className="flex items-center justify-between p-2.5 sm:p-3.5 md:p-4 rounded-xl md:rounded-2xl border border-[#2DC08D]/30 bg-[#2DC08D]/5 text-left mb-2.5 md:mb-3.5">
              <div>
                <span className="text-xs md:text-sm font-semibold text-neutral-900 block">Outly Cloud Pro</span>
                <span className="text-[10px] md:text-xs text-neutral-500">Lifetime access · Instant unlock</span>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-neutral-900">₹1</span>
                  <span className="text-[10px] md:text-xs text-neutral-400 line-through">₹99</span>
                </div>
                <span className="text-[9px] md:text-[10px] font-semibold text-[#2DC08D] uppercase tracking-wide">Launch Price</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="space-y-1.5 md:space-y-2">
              <Button
                onClick={handleRazorpayPayment}
                disabled={isProcessingPayment}
                className="w-full bg-[#111111] hover:bg-black text-white rounded-xl md:rounded-2xl font-semibold text-xs sm:text-[13px] md:text-sm h-10 md:h-12 transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing upgrade...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#2DC08D] fill-[#2DC08D]" />
                    <span>Upgrade to Pro for ₹1</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/pricing");
                }}
                className="w-full text-[10.5px] md:text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors py-0.5 md:py-1 cursor-pointer text-center"
              >
                View all pricing plans &rarr;
              </button>
            </div>

            {/* Footer Trust Badge */}
            <div className="text-[10px] md:text-[11px] text-neutral-400 border-t border-neutral-100 pt-2 md:pt-3 mt-2 md:mt-3 flex items-center justify-center gap-1.5 font-mono select-none">
              <Lock className="w-3 h-3 text-neutral-400" />
              <span>Secured by 256-bit Razorpay checkout</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
