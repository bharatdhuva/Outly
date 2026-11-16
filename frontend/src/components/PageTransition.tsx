/**
 * PageTransition.tsx — uses motion/react
 * Wraps page content with fade+slide on route change.
 * Progress bar uses scaleX on transform, never width.
 */
import { m, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { pageVariants, dur, ease } from "@/lib/motion-tokens";

// ─── Global loading state ────────────────────────────────────────────────────
const listeners = new Set<(loading: boolean) => void>();
let globalLoading = false;

export const setGlobalLoading = (loading: boolean) => {
  globalLoading = loading;
  listeners.forEach((l) => l(loading));
};

// ─── Page wrapper ────────────────────────────────────────────────────────────
export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={location.pathname}
        className="w-full flex-1 flex flex-col"
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

// ─── Navigation hook ─────────────────────────────────────────────────────────
export function usePageTransition() {
  const navigate = useNavigate();
  return (to: string) => {
    setGlobalLoading(true);
    setTimeout(() => navigate(to), 100);
  };
}

// ─── Top progress bar ────────────────────────────────────────────────────────
// Uses scaleX (transform) rather than width to avoid layout shift.
export function GlobalPageTransitionInterceptor() {
  const [loading, setLoading] = useState(globalLoading);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handler = (l: boolean) => {
      setLoading(l);
      if (l) { setVisible(true); setProgress(0.15); }
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  useEffect(() => {
    setGlobalLoading(false);
    setProgress(0.35);
    const t1 = setTimeout(() => setProgress(1), 100);
    const t2 = setTimeout(() => setVisible(false), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [location]);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 0.9) { clearInterval(id); return 0.9; }
        return p + (Math.random() * 0.08 + 0.04);
      });
    }, 80);
    return () => clearInterval(id);
  }, [loading]);

  if (!visible) return null;

  return (
    <m.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-primary z-[9999] pointer-events-none"
      style={{ scaleX: progress, transformOrigin: "left center" }}
      animate={{ opacity: progress >= 1 ? 0 : 1 }}
      transition={{ duration: dur.exit, ease: ease.in }}
    />
  );
}
