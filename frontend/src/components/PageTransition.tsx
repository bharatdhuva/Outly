import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Global loading state and listeners
const listeners = new Set<(loading: boolean) => void>();
let globalLoading = false;

export const setGlobalLoading = (loading: boolean) => {
  globalLoading = loading;
  listeners.forEach((l) => l(loading));
};

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter:   { opacity: 1, y: 0,  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.2,  ease: [0.4, 0, 1, 1] } },
};

/**
 * PageTransition — wraps page content with a smooth fade + slide entrance on every route change.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    // Snap scroll to top immediately to prevent stuttery page shifts
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="w-full flex-1 flex flex-col"
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * usePageTransition — Hook to navigate with a smooth loading bar transition.
 */
export function usePageTransition() {
  const navigate = useNavigate();
  return (to: string) => {
    setGlobalLoading(true);
    // Small delay to allow the loading bar to start animating
    setTimeout(() => navigate(to), 120);
  };
}

/**
 * GlobalPageTransitionInterceptor — Renders the top progress bar.
 */
export function GlobalPageTransitionInterceptor() {
  const [loading, setLoading] = useState(globalLoading);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handler = (l: boolean) => {
      setLoading(l);
      if (l) setProgress(15);
      else setProgress(100);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  // Complete the progress bar and trigger a quick flash on any route change
  useEffect(() => {
    setGlobalLoading(false);
    setProgress(35);
    const timer = setTimeout(() => setProgress(100), 100);
    return () => clearTimeout(timer);
  }, [location]);

  // Simulate progress bar movement while loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) { clearInterval(interval); return 90; }
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 80);
    }
    return () => clearInterval(interval);
  }, [loading]);

  if (progress === 0) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500 z-[9999] pointer-events-none origin-left"
      style={{ width: `${progress}%` }}
      animate={{ opacity: progress === 100 ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => {
        if (progress === 100) setTimeout(() => setProgress(0), 300);
      }}
    />
  );
}
