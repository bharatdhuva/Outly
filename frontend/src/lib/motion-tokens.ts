/**
 * motion-tokens.ts
 * Single source of truth for all animation values.
 * Import these everywhere. Never write durations/easings inline.
 */

// ─── Durations (ms) ───────────────────────────────────────────────────────────
export const dur = {
  instant: 0.1,   // 100ms — press feedback, focus ring
  fast:    0.15,  // 150ms — hover states, badge counts
  normal:  0.22,  // 220ms — menu open/close, tab switch
  enter:   0.30,  // 300ms — page elements entering
  exit:    0.18,  // 180ms — always shorter than enter
  layout:  0.28,  // 280ms — Collapse, list reorder
} as const;

// ─── Easings ─────────────────────────────────────────────────────────────────
export const ease = {
  out:    [0.16, 1, 0.3, 1]   as [number, number, number, number], // enters, expansions
  in:     [0.4, 0, 1, 1]      as [number, number, number, number], // exits, collapses
  inout:  [0.4, 0, 0.2, 1]    as [number, number, number, number], // layout transitions
} as const;

// ─── Springs ─────────────────────────────────────────────────────────────────
export const spring = {
  /** Interactive cards, shared-layout moves */
  snappy: { type: "spring", stiffness: 400, damping: 32, mass: 1 } as const,
  /** Modals, drawers, sheet panels */
  soft:   { type: "spring", stiffness: 240, damping: 28, mass: 1 } as const,
  /** Micro: button press, badge scale */
  micro:  { type: "spring", stiffness: 600, damping: 36, mass: 0.6 } as const,
} as const;

// ─── Stagger delays (s) ──────────────────────────────────────────────────────
export const stagger = {
  tight: 0.04,  // 40ms — list items (up to 8)
  loose: 0.06,  // 60ms — section reveals (3–4 sections)
} as const;

// ─── Shared variant factories ─────────────────────────────────────────────────

/** Standard fade-up for page sections */
export const fadeUpVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.enter, ease: ease.out } },
  exit:    { opacity: 0, y: -6, transition: { duration: dur.exit,  ease: ease.in  } },
} as const;

/** Fade only — for overlays, tooltips, toasts */
export const fadeVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dur.normal, ease: ease.out } },
  exit:    { opacity: 0, transition: { duration: dur.exit,   ease: ease.in  } },
} as const;

/** Scale+fade for menus and dropdowns */
export const popVariants = {
  hidden:  { opacity: 0, scale: 0.96, y: -6 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { duration: dur.normal, ease: ease.out } },
  exit:    { opacity: 0, scale: 0.97, y: -4, transition: { duration: dur.exit,   ease: ease.in  } },
} as const;

/** Slide from bottom — modals, sheet dialogs */
export const slideUpVariants = {
  hidden:  { opacity: 0, y: 24,  scale: 0.98 },
  visible: { opacity: 1, y: 0,   scale: 1,    transition: spring.soft },
  exit:    { opacity: 0, y: 16,  scale: 0.99, transition: { duration: dur.exit, ease: ease.in } },
} as const;

/** Stagger container — apply to the list wrapper */
export const staggerContainer = (delayChildren = 0, staggerChildren = stagger.tight) => ({
  hidden:  {},
  visible: { transition: { delayChildren, staggerChildren } },
} as const);

/** Stagger item — apply to each child */
export const staggerItem = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.enter, ease: ease.out } },
} as const;

/** Page transition */
export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter:   { opacity: 1, y: 0,  transition: { duration: dur.enter, ease: ease.out } },
  exit:    { opacity: 0, y: -4, transition: { duration: dur.exit,  ease: ease.in  } },
} as const;
