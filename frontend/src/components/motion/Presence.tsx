/**
 * Presence.tsx
 * Consistent AnimatePresence wrapper. Use instead of raw AnimatePresence.
 * Ensures mode="wait" and popLayout are consistent across the app.
 */
import { AnimatePresence } from "motion/react";
import type { ReactNode } from "react";

interface PresenceProps {
  children: ReactNode;
  mode?: "wait" | "sync" | "popLayout";
}

export function Presence({ children, mode = "wait" }: PresenceProps) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>;
}
