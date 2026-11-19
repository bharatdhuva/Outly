import { createRoot } from "react-dom/client";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "./lib/vitals";

// Initialize Core Web Vitals RUM monitoring
initWebVitals();

// Sync visual viewport height with CSS variable for reliable mobile keyboard scrolling
if (typeof window !== "undefined") {
  const updateVisualViewport = () => {
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--visual-viewport-height", `${vh}px`);
  };
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateVisualViewport);
    window.visualViewport.addEventListener("scroll", updateVisualViewport);
  }
  window.addEventListener("resize", updateVisualViewport);
  window.addEventListener("orientationchange", updateVisualViewport);
  updateVisualViewport();

  // Smoothly scroll focused input into comfortable view when soft keyboard opens
  document.addEventListener(
    "focusin",
    (e) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
      ) {
        const dialog = target.closest('[role="dialog"]');
        if (dialog) {
          setTimeout(() => {
            target.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }, 200);
        }
      }
    },
    { passive: true }
  );
}

createRoot(document.getElementById("root")!).render(
  // LazyMotion loads only the animation features we use, cutting bundle size.
  // MotionConfig reducedMotion="user" reads the OS preference — no animation
  // plays when the user has "Reduce motion" enabled in system settings.
  <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </LazyMotion>
);
