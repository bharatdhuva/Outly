/**
 * Stagger.tsx
 * List stagger container. Wrap a list; children get staggerItem variants.
 * Children must have variants={staggerItem} and NOT define their own initial/animate.
 */
import { m } from "motion/react";
import { type ReactNode } from "react";
import { staggerContainer, staggerItem, stagger as staggerTokens } from "@/lib/motion-tokens";

interface StaggerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  gap?: "tight" | "loose";
  as?: "ul" | "ol" | "div";
}

export function Stagger({
  children,
  className,
  delay = 0,
  gap = "tight",
  as = "div",
}: StaggerProps) {
  const staggerDelay = gap === "tight" ? staggerTokens.tight : staggerTokens.loose;
  const container = staggerContainer(delay, staggerDelay);

  return (
    <m.div
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </m.div>
  );
}

/** Convenience wrapper for a stagger child */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <m.div variants={staggerItem} className={className}>
      {children}
    </m.div>
  );
}
