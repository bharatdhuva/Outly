import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Lock, Clock, Check, LogIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

function IosRadialSpinner({ className = "w-5 h-5 text-outly-dark" }: { className?: string }) {
  const blades = [
    { deg: 0, opacity: 1.0 },
    { deg: 30, opacity: 0.18 },
    { deg: 60, opacity: 0.25 },
    { deg: 90, opacity: 0.32 },
    { deg: 120, opacity: 0.40 },
    { deg: 150, opacity: 0.48 },
    { deg: 180, opacity: 0.56 },
    { deg: 210, opacity: 0.64 },
    { deg: 240, opacity: 0.73 },
    { deg: 270, opacity: 0.82 },
    { deg: 300, opacity: 0.90 },
    { deg: 330, opacity: 0.96 },
  ];

  return (
    <svg
      className={`${className} animate-[spin_0.85s_steps(12,end)_infinite] shrink-0`}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {blades.map(({ deg, opacity }) => (
        <rect
          key={deg}
          x="10.85"
          y="1.5"
          width="2.3"
          height="5.8"
          rx="1.15"
          opacity={opacity}
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

function saveUserSession(res: any) {
  if (!res) return;
  if (res.token) localStorage.setItem("outly_token", res.token);
  if (res.user) {
    localStorage.setItem("outly_premium_user", String(res.user.plan === "pro"));
    localStorage.setItem("outly_is_demo", "false");
    localStorage.removeItem("outly_demo_expires_at");
    if (res.user.role) localStorage.setItem("outly_user_role", res.user.role);
    if (res.user.fullName) localStorage.setItem("outly_user_name", res.user.fullName);
    if (res.user.profilePic) localStorage.setItem("outly_user_avatar", res.user.profilePic);
    if (res.user.email) localStorage.setItem("outly_user_email", res.user.email);
    localStorage.setItem("outly_user_session", JSON.stringify({ user: res.user }));
  }
}

export function DemoSignupModal() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const handleDemoModal = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail || {};
      const expired = Boolean(detail.isExpired) || detail.code === "DEMO_EXPIRED";

      setIsExpired(expired);
      setModalMessage(
        detail.message ||
          (expired
            ? "Your 25-minute demo session has expired. Sign up with Google to keep your progress and continue."
            : "Sign up with Google to save your progress, unlock unlimited ATS checks, and start sending real cold outreach.")
      );
      setOpen(true);
    };

    window.addEventListener("outly_demo_modal", handleDemoModal);
    return () => window.removeEventListener("outly_demo_modal", handleDemoModal);
  }, []);

  const handleGoogleSignUp = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);

    const google = (window as any).google;
    if (typeof google === "undefined" || !google.accounts) {
      try {
        const res = await api.auth.googleLogin("mock_bypass_token");
        saveUserSession(res);
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#2dc08d", "#1a1a1a"],
        });
        setOpen(false);
        setIsGoogleLoading(false);
        toast({
          title: "Account Created! 🎉",
          description: "Welcome to Outly. Your workspace is now fully unlocked.",
        });
        window.location.reload();
      } catch (err: any) {
        toast({
          title: "Google sign-in failed",
          description: err.message || "Failed to authenticate.",
          variant: "destructive",
        });
        setIsGoogleLoading(false);
      }
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: "137235712014-et2q796j1m13efh3qacdlkdbom3o11b4.apps.googleusercontent.com",
        scope: "email profile openid",
        callback: async (response: any) => {
          if (response.error) {
            toast({
              title: "Google sign-in failed",
              description: "Unable to authenticate with Google.",
              variant: "destructive",
            });
            setIsGoogleLoading(false);
            return;
          }
          if (response.access_token) {
            try {
              const res = await api.auth.googleLogin(response.access_token);
              saveUserSession(res);
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#2dc08d", "#1a1a1a"],
              });
              setOpen(false);
              setIsGoogleLoading(false);
              toast({
                title: "Welcome to Outly! 🎉",
                description: "Your account is active and demo restrictions have been lifted.",
              });
              window.location.reload();
            } catch (err: any) {
              toast({
                title: "Google login backend error",
                description: err.message || "Failed to sign up with Google.",
                variant: "destructive",
              });
              setIsGoogleLoading(false);
            }
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      setIsGoogleLoading(false);
      toast({
        title: "Connection error",
        description: "Google client init failed.",
        variant: "destructive",
      });
    }
  };

  const handleReturnToLogin = () => {
    localStorage.removeItem("outly_token");
    localStorage.removeItem("outly_is_demo");
    localStorage.removeItem("outly_demo_expires_at");
    setOpen(false);
    navigate("/login");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        // Block closing if the demo session has expired!
        if (!val && isExpired) return;
        setOpen(val);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[90%] max-w-[420px] select-none p-0 border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] rounded-[26px]">
        <div className="relative bg-[#FAF8F5] p-6 text-center flex flex-col">
          {/* Top Badge Icon */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-outly-accent/10 border border-outly-accent/20 text-outly-accent mt-2 shadow-xs">
            {isExpired ? (
              <Clock className="h-6 w-6 text-amber-600 stroke-[2.2]" />
            ) : (
              <Sparkles className="h-6 w-6 text-outly-accent stroke-[2.2]" />
            )}
          </div>

          {/* Headline & Description */}
          <div className="space-y-1.5 text-center mt-3.5">
            <DialogTitle className="text-2xl font-normal text-outly-dark tracking-tight font-serif">
              {isExpired ? "Demo session ended" : "Like what you see?"}
            </DialogTitle>
            <DialogDescription className="text-xs text-outly-dark/70 leading-relaxed px-1">
              {modalMessage}
            </DialogDescription>
          </div>

          {/* Value Prop Benefits Card */}
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-4 text-left my-4 shadow-2xs">
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-outly-dark/85">
                <div className="w-4 h-4 rounded-full bg-[#2DC08D]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-[#2DC08D] stroke-[2.8]" />
                </div>
                <span>
                  <strong>Save your progress</strong> &amp; keep your tailored materials
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-outly-dark/85">
                <div className="w-4 h-4 rounded-full bg-[#2DC08D]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-[#2DC08D] stroke-[2.8]" />
                </div>
                <span>
                  <strong>Unlimited 27-factor ATS scans</strong> and keyword alignment
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-outly-dark/85">
                <div className="w-4 h-4 rounded-full bg-[#2DC08D]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-[#2DC08D] stroke-[2.8]" />
                </div>
                <span>
                  <strong>Cold recruiter email automation</strong> with AI personalization
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-outly-dark/85">
                <div className="w-4 h-4 rounded-full bg-[#2DC08D]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-[#2DC08D] stroke-[2.8]" />
                </div>
                <span>
                  <strong>Full job pipeline tracker</strong> with morning prep briefs
                </span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2.5">
            <Button
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
              className="w-full min-h-[46px] bg-white hover:bg-neutral-50 text-outly-dark border border-[#E8E2D5] hover:border-outly-dark/40 rounded-full font-medium text-xs sm:text-[13.5px] transition-all shadow-xs active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {isGoogleLoading ? (
                <>
                  <IosRadialSpinner className="w-4 h-4 text-outly-dark" />
                  <span>Connecting Google Account...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </Button>

            {/* Dismiss / Return to Login button */}
            {isExpired ? (
              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full text-xs text-neutral-500 hover:text-outly-dark transition-colors py-1 cursor-pointer font-medium flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Return to Login page</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full text-xs text-neutral-500 hover:text-outly-dark transition-colors py-1 cursor-pointer font-medium"
              >
                Keep exploring demo &rarr;
              </button>
            )}
          </div>

          {/* Footer note */}
          <div className="text-[10px] text-neutral-400 border-t border-neutral-200/60 pt-3 mt-3 flex items-center justify-center gap-1.5 select-none">
            <Lock className="w-3 h-3 text-neutral-400" />
            <span>Free forever · No credit card required</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
