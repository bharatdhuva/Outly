import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { useNotifications, notify, type ActiveToast } from "@/lib/notify";
import "./toaster.css";

function ToastItem({ toast }: { toast: ActiveToast }) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(toast.duration);
  const isPausedRef = useRef<boolean>(false);

  const triggerDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      notify.dismiss(toast.id);
    }, 200);
  }, [toast.id]);

  const startTimer = useCallback(
    (duration: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        triggerDismiss();
      }, duration);
    },
    [triggerDismiss]
  );

  const pauseTimer = () => {
    if (isPausedRef.current) return;
    isPausedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  };

  const resumeTimer = () => {
    if (!isPausedRef.current) return;
    isPausedRef.current = false;
    if (remainingTimeRef.current > 0) {
      startTimer(remainingTimeRef.current);
    } else {
      triggerDismiss();
    }
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    startTimer(remainingTimeRef.current);

    return () => {
      cancelAnimationFrame(frame);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  const handleTouchStart = (e: React.TouchEvent) => {
    pauseTimer();
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const diff = e.touches[0].clientY - touchStartY;
    if (diff > 0) {
      setTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    resumeTimer();
    if (translateY > 40) {
      triggerDismiss();
    } else {
      setTranslateY(0);
    }
    setTouchStartY(null);
  };

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";
  const isWarning = toast.type === "warning";

  const isVisible = mounted && !isExiting;

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
        opacity: translateY > 0 ? Math.max(0.2, 1 - translateY / 100) : undefined,
      }}
      className={`outly-toast ${
        isSuccess ? "outly-toast--success" : isError ? "outly-toast--error" : isWarning ? "outly-toast--warning" : "outly-toast--info"
      } ${
        isVisible
          ? "outly-toast--visible"
          : "outly-toast--hidden"
      }`}
    >
      <div className="outly-toast__content">
        {isSuccess && <CheckCircle2 className="outly-toast__icon" aria-hidden="true" />}
        {isError && <AlertCircle className="outly-toast__icon" aria-hidden="true" />}
        {isWarning && <AlertTriangle className="outly-toast__icon" aria-hidden="true" />}
        {!isSuccess && !isError && !isWarning && <Info className="outly-toast__icon" aria-hidden="true" />}

        <span className="outly-toast__message">
          {toast.message}
        </span>
      </div>

      <div className="outly-toast__controls">
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              triggerDismiss();
            }}
            className="outly-toast__action"
          >
            {toast.action.label}
          </button>
        )}

        <button
          type="button"
          onClick={triggerDismiss}
          aria-label="Close notification"
          className="outly-toast__close"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function Toaster() {
  const { toasts } = useNotifications();

  return (
    <div
      aria-label="Notifications"
      className="outly-toast-region"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
