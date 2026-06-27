import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";

// ─── Shared transition element ID ───
const TRANSITION_WRAPPER_ID = "page-transition-wrapper";

/**
 * PageTransition — wraps page content with a smooth fade+slide entrance.
 * Exit animation is triggered by `usePageTransition` hook before navigation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex-1 animate-fade-in">
      {children}
    </div>
  );
}

export function usePageTransition() {
  const navigate = useNavigate();
  return (to: string) => navigate(to);
}

export function GlobalPageTransitionInterceptor() {
  return null;
}
