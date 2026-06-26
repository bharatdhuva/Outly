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

/**
 * GlobalPageTransitionInterceptor — intercepts all clicks on internal links
 * and plays a smooth GSAP exit transition before routing to the new page.
 */
export function GlobalPageTransitionInterceptor() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Find the closest anchor tag
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const target = anchor.getAttribute("target");

      // Check if it is a valid internal route transition
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("//") &&
        (!target || target === "_self") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        // Prevent immediate React Router navigation
        e.preventDefault();
        e.stopPropagation();

        const el = document.getElementById(TRANSITION_WRAPPER_ID);
        if (!el) {
          navigate(href);
          return;
        }

        // Play smooth GSAP exit animation (fade out + slide up)
        gsap.to(el, {
          opacity: 0,
          y: -20,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            navigate(href);
          },
        });
      }
    };

    // Capture clicks at the document level before standard React Router event handlers execute
    document.addEventListener("click", handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [navigate]);

  return null;
}
