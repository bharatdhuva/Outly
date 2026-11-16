import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Check, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import logoTransparent from "@/assets/brand/outly_your_career_at_peak.png";
import { Spinner } from "@/components/Spinner";
import { m } from "motion/react";
import { dur } from "@/lib/motion-tokens";
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
      let message = customEvent.detail?.message || "You have reached the free tier limit for this feature.";
      if (
        typeof message !== "string" ||
        message.includes("<!DOCTYPE") ||
        message.includes("<html") ||
        message.includes("challenges.cloudflare.com") ||
        message.includes("Cloudflare") ||
        message.length > 280
      ) {
        message = "Free tier is limited to 3 ATS resume scans per 12 hours. Upgrade to Outly Pro for unlimited checks.";
      }
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
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const location = useLocation();
  useEffect(() => {
    if (showSuccess) setShowSuccess(false);
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleRazorpayPayment = async () => {
    try {
      setIsProcessingPayment(true);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast({
          title: "Connection Error",
          description: "Failed to load payment checkout. Please check your internet connection.",
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
          description: "Payment gateway key is missing. Redirecting to Pricing page...",
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
        description: "Unlock Outly Lifetime Pro",
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
              description: "Checkout was closed before completion.",
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
    } catch {
      setIsProcessingPayment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!showSuccess) setOpen(val); }}>
      <DialogContent className="max-h-[85vh] sm:max-h-[90vh] overflow-y-auto w-[90%] max-w-[360px] sm:max-w-[440px] md:max-w-[580px] lg:max-w-[620px] select-none p-0 border border-[#E0DBCF] bg-white shadow-xl rounded-2xl md:rounded-3xl">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center bg-white text-center gap-2.5 p-6 sm:p-8 md:p-10">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl md:text-2xl font-semibold text-[#1A1A1A] tracking-tight">Upgraded to Pro</DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-[#6B6760] max-w-sm leading-relaxed">
              All features including unlimited ATS checks, resume tailoring, and keyword gap analysis are now active.
            </DialogDescription>
            <Button
              onClick={() => setOpen(false)}
              className="mt-3 bg-[#1A1A1A] hover:bg-black text-white rounded-full text-xs md:text-sm font-medium px-6 h-9 md:h-11 cursor-pointer transition-colors"
            >
              Continue to Workspace
            </Button>
          </div>
        ) : (
          <div className="relative bg-white p-5 sm:p-7 md:p-8 text-center flex flex-col">
            {/* Lock / Security Badge */}
            <div className="mx-auto flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl bg-primary/10 border border-primary/20 text-primary mt-1 shadow-sm">
              <Lock className="h-5 w-5 stroke-[2]" />
            </div>

            {/* Header Details */}
            <div className="space-y-1.5 text-center mt-3">
              <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold text-[#1A1A1A] tracking-tight">
                Unlock Unlimited Scans
              </DialogTitle>
              <DialogDescription className="text-xs md:text-[13px] text-[#6B6760] leading-relaxed px-1 max-w-md mx-auto">
                {limitMessage || "You've reached your free limit. Upgrade to Outly Pro for unlimited scans and AI tailoring."}
              </DialogDescription>
            </div>

            {/* Value Proposition */}
            <div className="bg-outly-cream border border-outly-border rounded-xl md:rounded-2xl p-3 sm:p-4 text-left my-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-x-4 md:gap-y-3">
                <div className="flex items-start gap-2 text-xs md:text-[12.5px] text-[#1A1A1A]">
                  <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-primary stroke-[2.5]" />
                  </div>
                  <span><strong>Unlimited ATS checks</strong> with 27-factor scoring</span>
                </div>
                <div className="flex items-start gap-2 text-xs md:text-[12.5px] text-[#1A1A1A]">
                  <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-primary stroke-[2.5]" />
                  </div>
                  <span><strong>AI Resume Tailor</strong> for any target job description</span>
                </div>
                <div className="flex items-start gap-2 text-xs md:text-[12.5px] text-[#1A1A1A]">
                  <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-primary stroke-[2.5]" />
                  </div>
                  <span><strong>Recruiter keyword gap</strong> engine and fixes</span>
                </div>
                <div className="flex items-start gap-2 text-xs md:text-[12.5px] text-[#1A1A1A]">
                  <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-primary stroke-[2.5]" />
                  </div>
                  <span><strong>Resume Vault</strong> with unlimited saved versions</span>
                </div>
              </div>
            </div>

            {/* Pricing Callout Banner */}
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl md:rounded-2xl border border-primary/30 bg-primary/5 text-left mb-3.5">
              <div>
                <span className="text-xs md:text-sm font-semibold text-[#1A1A1A] block">Outly Pro</span>
                <span className="text-[11px] md:text-xs text-[#6B6760]">Lifetime access · Instant unlock</span>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">₹1</span>
                  <span className="text-xs text-[#B0ADA9] line-through">₹99</span>
                </div>
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Launch Price</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="space-y-2">
              <m.button
                type="button"
                onClick={handleRazorpayPayment}
                disabled={isProcessingPayment}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: dur.instant }}
                className="w-full bg-[#1A1A1A] hover:bg-black text-white rounded-full font-medium text-xs sm:text-[13px] md:text-sm h-11 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessingPayment ? (
                  <>
                    <Spinner size={16} className="text-white" />
                    <span>Processing upgrade…</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-primary fill-primary" />
                    <span>Upgrade to Pro for ₹1</span>
                  </>
                )}
              </m.button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/pricing");
                }}
                className="w-full text-xs font-normal text-[#6B6760] hover:text-[#1A1A1A] transition-colors py-1 cursor-pointer text-center min-h-[44px] flex items-center justify-center"
              >
                View all pricing plans &rarr;
              </button>
            </div>

            {/* Footer Trust Badge */}
            <div className="text-[11px] text-[#B0ADA9] border-t border-[#E0DBCF]/60 pt-3 mt-3 flex items-center justify-center gap-1.5 font-mono select-none">
              <Lock className="w-3 h-3 text-[#B0ADA9]" />
              <span>Secured by 256-bit Razorpay checkout</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
