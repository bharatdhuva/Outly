/**
 * FadeUp.tsx
 * Scroll-reveal wrapper. Triggers once per mount (not per scroll pass).
 * Use for section-level reveals, not individual items.
 */
import { m, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";
import { fadeUpVariants } from "@/lib/motion-tokens";

interface FadeUpProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeUp({ children, className, delay = 0 }: FadeUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });

  const variants = delay
    ? {
        ...fadeUpVariants,
        visible: {
          ...fadeUpVariants.visible,
          transition: { ...fadeUpVariants.visible.transition, delay },
        },
      }
    : fadeUpVariants;

  return (
    <m.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </m.div>
  );
}
