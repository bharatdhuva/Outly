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
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[90%] max-w-[350px] border-border bg-white p-5 shadow-2xl rounded-2xl text-center space-y-4 select-none">
          
          {/* Prominent top-right Close button */}
          <div className="absolute right-3 top-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="p-1.5 rounded-full text-muted-foreground hover:bg-slate-100 hover:text-foreground transition cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Lock Icon Badge */}
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm mt-1">
            <Lock className="h-4.5 w-4.5 stroke-[2.2]" />
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5 text-center">
            <h2 className="text-base font-bold text-foreground leading-snug">
              Unlock {featureTitle}
            </h2>
            <p className="text-[11.5px] text-muted-foreground leading-relaxed px-1">
              Outly's advanced search engine and automation tools require a Cloud Plan. Get started with our trial below.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-1.5 flex flex-col gap-2.5">
            <Button
              onClick={handleRazorpayPayment}
              disabled={isProcessingPayment}
              className="w-full bg-primary text-white hover:brightness-105 rounded-full font-bold text-[11.5px] h-9.5 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
            >
              {isProcessingPayment ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                "Start 7-Day Trial @ ₹1"
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                navigate("/pricing");
              }}
              className="w-full text-[11px] font-bold text-primary hover:underline h-8 cursor-pointer text-center"
            >
              View pricing plans &rarr;
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
