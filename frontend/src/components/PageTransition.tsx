import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Global loading state and listeners
const listeners = new Set<(loading: boolean) => void>();
let globalLoading = false;

export const setGlobalLoading = (loading: boolean) => {
  globalLoading = loading;
  listeners.forEach((l) => l(loading));
};

/**
 * PageTransition — wraps page content with a smooth fade + slide entrance on every route change.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="w-full flex-1 animate-page-enter">
      <style>{`
        @keyframes page-enter {
          0% {
            opacity: 0.15;
            transform: translateY(6px);
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        .animate-page-enter {
          animation: page-enter 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform, opacity, filter;
        }
      `}</style>
      {children}
    </div>
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
    setTimeout(() => {
      navigate(to);
    }, 120);
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
      if (l) {
        setProgress(15);
      } else {
        setProgress(100);
      }
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  // Complete the progress bar and trigger a quick flash on any route change
  useEffect(() => {
    setGlobalLoading(false);
    setProgress(35);
    const timer = setTimeout(() => {
      setProgress(100);
    }, 100);
    return () => clearTimeout(timer);
  }, [location]);

  // Simulate progress bar movement while loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 80);
    }
    return () => clearInterval(interval);
  }, [loading]);

  if (progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500 z-[9999] transition-all duration-300 ease-out pointer-events-none"
      style={{
        width: `${progress}%`,
        opacity: progress === 100 ? 0 : 1,
      }}
      onTransitionEnd={() => {
        if (progress === 100) {
          // Reset progress after fade out
          setTimeout(() => setProgress(0), 300);
        }
      }}
    />
  );
}
