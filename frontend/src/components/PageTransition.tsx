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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Enter: fade in + gentle slide up
    gsap.fromTo(
      el,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: "power3.out",
        clearProps: "all",
      }
    );
  }, [location.pathname]);

  return (
    <div ref={wrapperRef} id={TRANSITION_WRAPPER_ID} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}

/**
 * usePageTransition — returns a navigate function that plays
 * an exit animation before routing to the target page.
 *
 * Usage:
 *   const navigateTo = usePageTransition();
 *   <button onClick={() => navigateTo("/login")}>Sign in</button>
 */
export function usePageTransition() {
  const navigate = useNavigate();

  const navigateTo = useCallback(
    (to: string) => {
      const el = document.getElementById(TRANSITION_WRAPPER_ID);

      if (!el) {
        // Fallback: navigate immediately if wrapper not found
        navigate(to);
        return;
      }

      // Exit: fade out + slide up
      gsap.to(el, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          navigate(to);
        },
      });
    },
    [navigate]
  );

  return navigateTo;
}
