/**
 * PageTransition.tsx — Outly View Transitions & Non-blocking Route Navigation
 *
 * Implements:
 * 1. Native View Transitions API (document.startViewTransition) with graceful fallback
 * 2. Non-blocking incoming-only animation (NO AnimatePresence mode="wait")
 * 3. Immediate 0ms navigation dispatch (no setTimeout delay)
 * 4. Automatic scroll to top on new navigation, focus management for a11y
 * 5. ScaleX-only top progress bar for background route preloads
 */
import { m } from "motion/react";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { useLocation, useNavigate, type NavigateOptions, type NavigateFunction } from "react-router-dom";
import { dur, ease } from "@/lib/motion";

// ─── Global loading state for route prefetch / background loads ───────────────
const listeners = new Set<(loading: boolean) => void>();
let globalLoading = false;

export const setGlobalLoading = (loading: boolean) => {
  globalLoading = loading;
  listeners.forEach((l) => l(loading));
};

// ─── Native View Transitions Navigation Helper ───────────────────────────────
export function transitionNavigate(
  navigate: NavigateFunction,
  to: string,
  options?: NavigateOptions
) {
  // Check prefers-reduced-motion first
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    !prefersReduced
  ) {
    (document as any).startViewTransition(() => {
      navigate(to, options);
    });
  } else {
    navigate(to, options);
  }
}

// ─── Navigation hook (instant response, <100ms) ───────────────────────────────
export function usePageTransition() {
  const navigate = useNavigate();
  return (to: string, options?: NavigateOptions) => {
    transitionNavigate(navigate, to, options);
  };
}

// ─── Page wrapper ────────────────────────────────────────────────────────────
// Animate INCOMING page only. Never block route exits with AnimatePresence mode="wait".
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Scroll restoration: top on new route
    window.scrollTo(0, 0);

    // Focus management for accessibility
    const timer = setTimeout(() => {
      const heading =
        document.querySelector("main h1") ||
        document.querySelector("h1") ||
        document.querySelector("main");
      if (heading && !heading.hasAttribute("tabindex")) {
        heading.setAttribute("tabindex", "-1");
        (heading as HTMLElement).focus({ preventScroll: true });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const hasViewTransition =
    typeof document !== "undefined" && "startViewTransition" in document;

  // On first mount or when View Transitions handle the cross-fade, render static container
  if (hasViewTransition) {
    return <div className="w-full flex-1 flex flex-col">{children}</div>;
  }

  // Fallback for browsers without View Transitions: fast 200ms incoming drift
  return (
    <m.div
      key={location.pathname}
      className="w-full flex-1 flex flex-col"
      initial={isFirstMount.current ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.route, ease: ease.out }}
    >
      {children}
    </m.div>
  );
}

// ─── Top progress bar (scaleX transform only, no width animation) ─────────────
export function GlobalPageTransitionInterceptor() {
  const [loading, setLoading] = useState(globalLoading);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handler = (l: boolean) => {
      setLoading(l);
      if (l) {
        setVisible(true);
        setProgress(0.2);
      }
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  useEffect(() => {
    setGlobalLoading(false);
    setProgress(0.6);
    const t1 = setTimeout(() => setProgress(1), 80);
    const t2 = setTimeout(() => setVisible(false), 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <m.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-primary z-[9999] pointer-events-none"
      style={{
        scaleX: progress,
        transformOrigin: "left center",
        transition: "transform 200ms ease, opacity 200ms ease",
      }}
      animate={{ opacity: progress >= 1 ? 0 : 1 }}
    />
  );
}
