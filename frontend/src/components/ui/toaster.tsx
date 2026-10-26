import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { useNotifications, notify, type ActiveToast } from "@/lib/notify";

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
      className={`pointer-events-auto flex w-full items-center justify-between gap-2.5 rounded-xl border border-border bg-card px-3.5 py-1 text-card-foreground shadow-md transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-opacity motion-reduce:transform-none ${
        isVisible
          ? "translate-y-0 opacity-100 md:translate-x-0 md:translate-y-0"
          : "translate-y-3 opacity-0 md:translate-x-4 md:translate-y-0"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5 py-2">
        {isSuccess && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
        {isError && <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />}
        {isWarning && <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />}
        {!isSuccess && !isError && !isWarning && <Info className="h-4 w-4 shrink-0 text-info" />}

        <span className="truncate text-xs font-medium leading-normal text-card-foreground">
          {toast.message}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              triggerDismiss();
            }}
            className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center px-2 text-xs font-semibold text-primary transition-colors hover:text-primary/80 focus:outline-none"
          >
            {toast.action.label}
          </button>
        )}

        <button
          type="button"
          onClick={triggerDismiss}
          aria-label="Close notification"
          className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center p-1 text-muted-foreground transition-colors hover:text-card-foreground focus:outline-none"
        >
          <X className="h-4 w-4" />
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
      className="fixed z-[9999] pointer-events-none flex flex-col gap-2 bottom-[calc(4rem+12px+env(safe-area-inset-bottom,0px))] left-4 right-4 w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] items-center md:bottom-auto md:top-[calc(4rem+12px)] md:right-4 md:left-auto md:w-[360px] md:max-w-[360px] md:items-end font-sans"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
