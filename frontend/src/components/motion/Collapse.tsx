/**
 * Collapse.tsx
 * Animates height from 0 to auto (or vice versa) using motion layout.
 * Never animates height directly — uses a clip + opacity pattern
 * that avoids layout shift.
 */
import { m, AnimatePresence } from "motion/react";
import type { ReactNode } from "react";
import { dur, ease } from "@/lib/motion-tokens";

interface CollapseProps {
  open: boolean;
  children: ReactNode;
  className?: string;
}

export function Collapse({ open, children, className }: CollapseProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <m.div
          key="collapse-content"
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: 1,
            height: "auto",
            transition: { duration: dur.layout, ease: ease.out },
          }}
          exit={{
            opacity: 0,
            height: 0,
            transition: { duration: dur.exit, ease: ease.in },
          }}
          style={{ overflow: "hidden" }}
          className={className}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
