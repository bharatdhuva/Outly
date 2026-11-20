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
import { prefetchRoute } from "@/lib/prefetch";

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
    prefetchRoute(to.split(/[?#]/, 1)[0]);
    navigate(to, options);
  };
}

// Track the first route globally: each route wrapper mounts fresh, so a local
// ref incorrectly treats every navigation as the initial render.
let hasMountedRoute = false;

// ─── Page wrapper ────────────────────────────────────────────────────────────
// Subtle enter motion on route changes; skip the initial page to keep first
// paint immediate and avoid holding a permanent compositor layer.
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const shouldAnimate = hasMountedRoute;

  useEffect(() => {
    hasMountedRoute = true;
    // Instant scroll restoration: top of window on new route without smooth-scroll lag
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <m.div
      key={location.pathname}
      className="w-full flex-1 flex flex-col will-change-[opacity,transform]"
      initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1],
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
    setProgress(0.4);

    const t1 = setTimeout(() => setProgress(0.85), 40);
    const t2 = setTimeout(() => setProgress(1), 120);
    const t3 = setTimeout(() => setVisible(false), 260);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[2.5px] z-[99999] pointer-events-none overflow-hidden">
      <m.div
        className="h-full bg-gradient-to-r from-[#0E8A7D] via-[#12A394] to-[#34D399] shadow-[0_0_12px_rgba(18,163,148,0.7)]"
        style={{
          scaleX: progress,
          transformOrigin: "left center",
          transition: "transform 130ms cubic-bezier(0.16, 1, 0.3, 1), opacity 130ms ease",
        }}
        animate={{ opacity: progress >= 1 ? 0 : 1 }}
      />
    </div>
  );
}
