/**
 * PageTransition.tsx — Fast, Silk-Smooth Route Transitions & Non-blocking Navigation
 *
 * Implements:
 * 1. Immediate 0ms navigation dispatch with smooth GPU-accelerated enter animation
 * 2. Subtle micro-lift (8px) + opacity fade (200ms) with [0.16, 1, 0.3, 1] natural decel
 * 3. Instant scroll restoration to top on route change
 * 4. Micro top-progress accent bar for tactile page switch feedback
 */
import { m } from "motion/react";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { useLocation, useNavigate, type NavigateOptions, type NavigateFunction } from "react-router-dom";

// ─── Native Navigation Helper (0ms delay, instantaneous dispatch) ───────────
export function transitionNavigate(
  navigate: NavigateFunction,
  to: string,
  options?: NavigateOptions
) {
  navigate(to, options);
}

// ─── Navigation hook (instant response, <100ms) ───────────────────────────────
export function usePageTransition() {
  const navigate = useNavigate();
  return (to: string, options?: NavigateOptions) => {
    navigate(to, options);
  };
}

// ─── Page wrapper ────────────────────────────────────────────────────────────
// Animates incoming page with silk-smooth opacity + micro-lift (8px) in 200ms.
// Fast, non-blocking, GPU-accelerated.
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Instant scroll restoration: top of window on new route without smooth-scroll lag
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    isFirstMount.current = false;
  }, []);

  return (
    <m.div
      key={location.pathname}
      className="w-full flex-1 flex flex-col will-change-[opacity,transform]"
      initial={isFirstMount.current ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1], // Natural ease-out exponential decel
      }}
    >
      {children}
    </m.div>
  );
}

// ─── Top progress bar (tactile feedback on route switch) ──────────────────────
export function GlobalPageTransitionInterceptor() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setVisible(true);
    setProgress(0.35);

    const t1 = setTimeout(() => setProgress(0.85), 50);
    const t2 = setTimeout(() => setProgress(1), 130);
    const t3 = setTimeout(() => setVisible(false), 240);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <m.div
      className="fixed top-0 left-0 right-0 h-[2.5px] bg-[#12A394] z-[9999] pointer-events-none shadow-[0_0_8px_rgba(18,163,148,0.5)]"
      style={{
        scaleX: progress,
        transformOrigin: "left center",
        transition: "transform 140ms cubic-bezier(0.16, 1, 0.3, 1), opacity 140ms ease",
      }}
      animate={{ opacity: progress >= 1 ? 0 : 1 }}
    />
  );
}
