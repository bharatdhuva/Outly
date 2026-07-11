import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, Check, ArrowRight, ShieldCheck, Zap, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import logoTransparent from "@/assets/brand/outly_your_career_at_peak.png";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  const [showModal, setShowModal] = useState(false);

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
              setShowModal(false);
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

  const handleFeatureClick = (e: React.MouseEvent) => {
    if (!isPremium) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
    }
  };

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <>
      <div 
        onClickCapture={handleFeatureClick} 
        className="w-full relative cursor-pointer select-none"
      >
        {children}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[90%] max-w-[350px] border-border bg-white p-5 shadow-2xl rounded-2xl text-center select-none overflow-hidden">
          
          {/* Top Premium Accent Border Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

          {/* Lock Icon Badge */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 shadow-inner text-primary mt-3">
            <Lock className="h-6 w-6 stroke-[2]" />
          </div>

          {/* Title & Description */}
          <div className="space-y-2 text-center pt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-extrabold uppercase tracking-wider">
              PRO MODULE LOCKED
            </span>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">
              Unlock {featureTitle}
            </h2>
            <p className="text-[11.5px] text-muted-foreground leading-relaxed px-1 font-medium">
              Outly's advanced search algorithms, auto-apply engines, and priority outreach queues require a Cloud Plan subscription.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <Button
              onClick={handleRazorpayPayment}
              disabled={isProcessingPayment}
              className="w-full bg-gradient-to-r from-primary to-[#25a97b] text-white hover:brightness-105 rounded-full font-bold text-[11.5px] h-10 shadow-md shadow-primary/25 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {isProcessingPayment ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 fill-white/10" />
                  <span>Get Lifetime Access @ ₹1</span>
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                navigate("/pricing");
              }}
              className="w-full text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors h-8 cursor-pointer text-center mt-0.5"
            >
              View pricing plans &rarr;
            </button>
          </div>

          {/* Secure Checkout Footer */}
          <div className="text-[9.5px] text-muted-foreground/60 border-t border-slate-100 pt-3 mt-4 flex items-center justify-center gap-1 font-medium select-none">
            <span>🔒 Secured by 256-bit Razorpay Gateway</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
