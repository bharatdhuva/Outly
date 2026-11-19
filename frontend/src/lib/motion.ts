/**
 * motion.ts — Outly Shared Motion System
 * Single source of truth for animation durations, easings, springs, and presets.
 * 
 * Rules:
 * 1. Animate ONLY `transform` (x, y, scale) and `opacity`. Never width/height/top/left.
 * 2. Small distances: offsets 8–16px, scale 0.96–1.0.
 * 3. Fast & purposeful: micro 120–180ms, enter/exit 180–260ms, route 180–240ms.
 * 4. All animations respect `prefers-reduced-motion`.
 */

// ─── Durations (in seconds for Motion / JS) ──────────────────────────────────
export const dur = {
  instant: 0.10, // 100ms — micro clicks, toggle ticks
  micro:   0.15, // 150ms — button press, hover feedback, active pill
  fast:    0.18, // 180ms — fast dropdown, toast enter
  normal:  0.22, // 220ms — modals, cards, tabs, standard enters
  exit:    0.16, // 160ms — always faster than enters to keep app snappy
  route:   0.20, // 200ms — route change transition
  scroll:  0.45, // 450ms — scroll reveals (capped at 500ms max)
  enter:   0.22, // 220ms — element enter alias
  layout:  0.22, // 220ms — layout reorder
} as const;

// ─── Easings ─────────────────────────────────────────────────────────────────
export const ease = {
  // Natural deceleration for entering elements
  out:    [0.16, 1, 0.3, 1] as [number, number, number, number],
  // Fast acceleration out of view for exiting elements
  in:     [0.4, 0, 1, 1] as [number, number, number, number],
  // Symmetrical ease for continuous or layout morphs
  inout:  [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;

// ─── Springs ─────────────────────────────────────────────────────────────────
export const spring = {
  /** Interactive cards, tab indicators, drag release */
  snappy: { type: "spring", stiffness: 400, damping: 32, mass: 1 } as const,
  /** Modals, bottom sheets, slide-overs */
  soft:   { type: "spring", stiffness: 240, damping: 28, mass: 1 } as const,
  /** Micro-interactions: button press, badge pop */
  micro:  { type: "spring", stiffness: 600, damping: 36, mass: 0.6 } as const,
} as const;

// ─── Stagger Tokens ──────────────────────────────────────────────────────────
export const stagger = {
  tight: 0.035, // 35ms between items
  loose: 0.05,  // 50ms between sections
} as const;

// ─── Standard Transform & Opacity Presets ────────────────────────────────────

/** Subtle fade only — for overlays, tooltips, background backdrops */
export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dur.normal, ease: ease.out } },
  exit:    { opacity: 0, transition: { duration: dur.exit, ease: ease.in } },
} as const;

/** Standard fade-up — for cards, sections, content blocks (max 12px drift) */
export const fadeUp = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.enter, ease: ease.out } },
  exit:    { opacity: 0, y: -6, transition: { duration: dur.exit, ease: ease.in } },
} as const;

/** Subtle scale+fade — for modals, dialogs, popovers (0.96 -> 1) */
export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: dur.normal, ease: ease.out } },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: dur.exit, ease: ease.in } },
} as const;

/** Dropdown menu preset — scale + small downward drift */
export const dropdown = {
  hidden:  { opacity: 0, scale: 0.96, y: -8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: dur.normal, ease: ease.out } },
  exit:    { opacity: 0, scale: 0.97, y: -4, transition: { duration: dur.exit, ease: ease.in } },
} as const;

/** Mobile bottom sheet slide up (transform y only) */
export const sheetUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: spring.soft },
  exit:    { opacity: 0, y: 16, transition: { duration: dur.exit, ease: ease.in } },
} as const;

/** Stagger container with cap — long lists never exceed ~400ms total animation */
export const staggerContainer = (
  delayChildren = 0,
  staggerChildren = stagger.tight,
  maxTotalDuration = 0.40
) => {
  return {
    hidden: {},
    visible: {
      transition: {
        delayChildren,
        staggerChildren: Math.min(staggerChildren, maxTotalDuration),
      },
    },
  } as const;
};

/** Stagger child item */
export const staggerItem = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.enter, ease: ease.out } },
} as const;

/** Incoming route enter animation (instant fallback when View Transitions not active) */
export const routeEnter = {
  initial: { opacity: 0, y: 8 },
  enter:   { opacity: 1, y: 0, transition: { duration: dur.route, ease: ease.out } },
  exit:    { opacity: 0, transition: { duration: dur.exit } },
} as const;

// ─── Legacy token aliases for backward compatibility ─────────────────────────
export const fadeVariants = fadeIn;
export const fadeUpVariants = fadeUp;
export const popVariants = dropdown;
export const slideUpVariants = sheetUp;
export const pageVariants = routeEnter;
