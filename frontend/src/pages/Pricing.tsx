import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  X,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Lock,
  Loader2,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import logoTransparent from "../assets/brand/outly_your_career_at_peak.png";
import pricingCatImage from "@/assets/pricing-cat.webp";
import pricingSeaImage from "@/assets/pricing-sea.webp";
import pricingFieldImage from "@/assets/pricing-field.webp";
import { api } from "@/lib/api";
import { m, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import "./Pricing.css";

export default function Pricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [displayPrice, setDisplayPrice] = useState(9);
  const priceValueRef = useRef(9);
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("outly_premium_user") === "true");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    const target = billingCycle === "yearly" ? 99 : 9;
    const start = priceValueRef.current;
    const duration = 400;
    const started = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + (target - start) * eased);
      priceValueRef.current = value;
      setDisplayPrice(value);
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [billingCycle]);

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

    let orderData: any;
    try {
      const amountInPaise = billingCycle === "monthly" ? 900 : 9900;
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
      description: `Outly Pro (${billingCycle === "monthly" ? "₹9 Monthly" : "₹99 Yearly"})`,
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
    <div className="pricing-page animate-fade-in">
      <div className="pricing-page-glow" aria-hidden="true" />

      {/* ─── HEADER (EXACT SAME AS LANDING) ─── */}
      <div className="pricing-page-header">
        <h2>
          Start free.<br />
          <i>Upgrade when you need more room.</i>
        </h2>

        {/* ─── BILLING TOGGLE (SMOOTH SLIDING SELECTOR) ─── */}
        <div className="billing-toggle" role="tablist" aria-label="Billing cycle">
          <span
            className={`billing-slider ${billingCycle === "yearly" ? "billing-slider-yearly" : ""}`}
            aria-hidden="true"
          />
          <button
            type="button"
            role="tab"
            aria-selected={billingCycle === "monthly"}
            className={`billing-monthly ${billingCycle === "monthly" ? "billing-active" : ""}`}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={billingCycle === "yearly"}
            className={`billing-yearly ${billingCycle === "yearly" ? "billing-active" : ""}`}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly <span>save 20%</span>
          </button>
        </div>
      </div>

      {/* ─── PRICING CARDS GRID (EXACT SAME AS LANDING WITH CAT & PIXEL ART) ─── */}
      <div className="pricing-page-grid">

        {/* ─── CARD 1: FREE CARD WITH SLEEPING CAT ─── */}
        <article className="price-card free-card">
          <div className="pricing-cat" aria-hidden="true">
            <img src={pricingCatImage} alt="Sleeping cat" />
            <span>z</span>
            <span>z</span>
          </div>
          <img className="pricing-art" src={pricingSeaImage} alt="" />

          <div className="price-content">
            <h3>Free</h3>
            <p>Everything you need to get moving.</p>

            <div className="price">
              <b>₹0</b>
              <span>forever</span>
            </div>

            <ul>
              <li>
                <Check size={15} />
                <span>3 free ATS resume checks per 12 hours</span>
              </li>
              <li>
                <Check size={15} />
                <span>Resume Vault (upload &amp; store master resumes)</span>
              </li>
              <li>
                <Check size={15} />
                <span>AI Job Search &amp; match discovery</span>
              </li>
              <li>
                <Check size={15} />
                <span>Application status tracker board</span>
              </li>
              <li>
                <Check size={15} />
                <span>Recruiter Cold Mail outreach generator</span>
              </li>
              <li className="unavailable">
                <X size={15} />
                <span>Unlimited tailoring</span>
              </li>
            </ul>

            <button
              type="button"
              disabled
              className="button button-white cursor-default"
            >
              {isPremium ? "Included in Pro" : "Current plan"}
            </button>
          </div>
        </article>

        {/* ─── CARD 2: PRO CARD WITH PIXEL FIELD ART & RAZORPAY INTEGRATION ─── */}
        <article className="price-card pro-card">
          <img className="pricing-art" src={pricingFieldImage} alt="" />

          <div className="price-content">
            <div className="pro-label">best for active job seekers</div>
            <h3>Pro</h3>
            <p>More room for every application.</p>

            <div className="price">
              <b>₹{displayPrice}</b>
              <span>{billingCycle === "yearly" ? "/ year" : "/ month"}</span>
            </div>

            <ul>
              <li>
                <Check size={15} />
                <span>Unlimited ATS checks with 27-factor scoring</span>
              </li>
              <li>
                <Check size={15} />
                <span>Unlimited AI resume tailoring for any job description</span>
              </li>
              <li>
                <Check size={15} />
                <span>Deep ATS score, keyword gap &amp; recruiter fixes</span>
              </li>
              <li>
                <Check size={15} />
                <span>Unlimited Resume Vault storage &amp; tailored versions</span>
              </li>
              <li>
                <Check size={15} />
                <span>Full Cold Mail automation &amp; recruiter outreach</span>
              </li>
              <li>
                <Check size={15} />
                <span>Unlimited job tracking on Kanban board</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={handleRazorpayPayment}
              disabled={isProcessingPayment}
              className="button button-teal"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isPremium ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Active Pro Plan</span>
                </>
              ) : (
                <>
                  <span>Try now</span>
                  <ArrowUpRight size={16} />
                </>
              )}
            </button>

            {!isPremium && (
              <button
                type="button"
                onClick={handleRazorpayPayment}
                className="buy-link"
              >
                or buy now
              </button>
            )}
          </div>
        </article>

      </div>

      {/* ─── DATA PRIVACY NOTE ─── */}
      <p className="pricing-note">
        <ShieldCheck size={14} /> your data stays yours on every plan. no pressure, cancel anytime.
      </p>

      {/* ─── COMPARE PLANS BANNER ─── */}
      <div className="pricing-page-compare-bar">
        <div>
          <h3>Not sure where to start?</h3>
          <p>Start free. Upgrade when your search deserves more room.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowCompare(true)}
          className="pricing-page-compare-btn"
        >
          <span>Compare plans</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="pricing-page-footer">
        <span>© 2026 Outly</span>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          <span>Your data stays private</span>
        </span>
      </footer>

      {/* ─── PAYMENT SUCCESS MODAL ─── */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[90%] max-w-[360px] bg-white p-6 shadow-2xl rounded-2xl border border-neutral-200 select-none text-center flex flex-col items-center">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] max-w-[560px] bg-white p-6 shadow-2xl rounded-2xl border border-neutral-200 text-left">
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
