# Outly Design System

> Written before any code changes. Every decision here has a reason.
> Components read from these tokens. No hard-coded values in components.

---

## 1. Product & Screen Purpose

**What Outly is:** A job-search automation workspace for mid-level professionals
actively hunting. Users are technical or semi-technical. They spend 10–45 min
per session. They are stressed, behind schedule and need the tool to feel
calm and fast — not flashy.

**One thing each screen must accomplish:**

| Screen | Primary job |
|---|---|
| Landing | Convince a skeptic that Outly is worth 60 seconds of their time, then move them to Login |
| Login | Complete Google auth or start a demo session in under 2 taps |
| Onboarding / Overview | Show the user what to do first. Surface the ATS check entry point. |
| ATS Score | Give a number, explain it, offer a next action. No clutter. |
| Resume Tailor | Let user paste a JD and get a tailored resume. Show progress clearly. |
| Resume Vault | Find and open a saved resume. One search, one list. |
| Cold Mail | Show the outreach queue. Send or skip each row. |
| Applications | Move a job through the pipeline. See at a glance where things stand. |
| Job Search | Find a job, judge fit, add to tracker. |
| Analytics | Confirm that the work is producing results. Numbers over time. |
| Pricing | Understand what Pro costs and decide. One CTA. |
| Settings | Update profile data the AI uses. Save. Leave. |
| Support | Find an answer or file a report. |
| Logs | Inspect what happened. Mostly read-only. |
| NotFound | Redirect without confusion. |

---

## 2. Type System

### Face choices (3 candidates, 1 selected)

**Candidate A — Geist + Instrument Serif**
Geist is Vercel's sans. Clean, slightly technical, good mono companion. Instrument Serif gives warmth
on headings. Risk: Geist is now everywhere in developer products; identifiable as "startup SaaS."

**Candidate B — Schibsted Grotesk + Playfair Display (what the codebase already has partially)**
Schibsted has strong personality — wide, editorial, confident. Pairs well with serif for display.
Problem: Playfair is overused on AI/job-search products. The italic looks decorative.

**Candidate C — Rubik + Instrument Serif ← SELECTED**
Rubik is a rounded grotesque with a human, slightly playful edge — still neutral enough for a tool
but warmer than Geist/Inter. Its rounded forms match the rounded-pill buttons and soft card corners
already in Outly's design. Instrument Serif (not Playfair) for the rare display headline:
thinner, less decorative, more confident. IBM Plex Mono for data/scores.

**Why C:** The product needs calm competence, not startup tech. Rubik's rounded forms
match the product's cream-and-green color palette. Instrument Serif is used at most once per page
for the page's focal headline — not scattered. Plex Mono makes score numbers look like
measurements, not marketing.

### Size scale (max 4 sizes per screen, never more)

```
--text-xs:      0.75rem  / 12px   — meta, timestamps, badges
--text-sm:      0.875rem / 14px   — body, labels, secondary buttons
--text-base:    1rem     / 16px   — primary body, nav items
--text-lg:      1.125rem / 18px   — card titles, section headings (Rubik, 500)
--text-xl:      1.25rem  / 20px   — sub-page headings (Rubik, 600)
--text-2xl:     1.5rem   / 24px   — page headings (Rubik, 600)
--text-3xl:     1.875rem / 30px   — focal headings on dense pages
--text-display: 3rem     / 48px   — Instrument Serif, used ONCE per page max
```

No screen should use more than 4 of these sizes simultaneously.

### Font weight discipline

- 400: body text, descriptions
- 500: labels, nav items, card titles
- 600: headings, button text, emphasis
- 700: score numbers, focal data only

---

## 3. Spacing Scale

Based on a 4px base unit:

```
--space-1:   4px
--space-2:   8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
```

**Rhythm rules:**
- Within a component (between label + input, icon + text): 8px
- Between related items in a list: 12px
- Between sections within a page area: 24–32px
- Between major page regions (header to content): 40–64px
- Never use the same gap for every level of a layout

---

## 4. Radius Scale

Three distinct levels (not `rounded-xl` on everything):

```
--radius-sm:   4px     — inline chips, small badges, input focus rings
--radius-md:   8px     — table rows, small cards, dropdown items
--radius-lg:  14px     — primary cards, panels, modals
--radius-xl:  24px     — pill buttons, demo CTA, modal sheets
--radius-full: 9999px  — avatar circles, status dots only
```

**When to use each:**
- Pill buttons → `radius-xl`
- Cards that contain content → `radius-lg`
- Inputs and selects → `radius-md`
- Tags and status chips → `radius-sm`

---

## 5. Elevation (3 levels)

```
Elevation 0 — Flat (no shadow)
  When: table rows, dividers, section labels.
  CSS: none.

Elevation 1 — Resting card (subtle lift)
  When: content cards on a surface, sidebar items on hover.
  CSS: 0 1px 3px rgba(26,26,26,0.07), 0 1px 2px rgba(26,26,26,0.04)

Elevation 2 — Raised / interactive
  When: dropdowns, popovers, the focused/hovered state of action cards.
  CSS: 0 4px 16px rgba(26,26,26,0.10), 0 2px 6px rgba(26,26,26,0.06)

Elevation 3 — Overlay
  When: modals, sheet dialogs. Never for decorative elements.
  CSS: 0 24px 60px rgba(26,26,26,0.18), 0 8px 24px rgba(26,26,26,0.10)
```

No glow shadows. No colored shadows. No `shadow-2xl` on content cards.

---

## 6. Color Roles

The existing palette is kept — it was well-chosen. What changes is how roles are
applied and enforced.

```
Surface:        #FAF8F5  — warm white/cream. All page backgrounds.
Surface-raised: #F0EDE7  — slightly warmer. Sidebar, header.
Surface-inset:  #E8E4DC  — pressed states, inset content areas.

Text-primary:   #1A1A1A  — body text, headings. Near-black.
Text-secondary: #6B6760  — meta, labels, placeholders.
Text-disabled:  #B0ADA9  — explicitly disabled content.

Border:         #E0DBCF  — default divider/border.
Border-strong:  #C8C3B8  — focus rings, active separators.

Primary:        #2DC08D  — Outly green. The only action color.
Primary-hover:  #25A87A  — 10% darker, hover state only.
Primary-muted:  #EAF8F2  — tinted backgrounds (success areas, selected rows).

Accent-red:     #E84B6A  — logo/brand red. Use only in logo, destructive actions.
Warning:        #F59E0B  — caution states. Never decorative.
Danger:         #EF4444  — destructive confirmations, error text.
Success:        #10B981  — confirmation, completed states. Alias of Primary at same value.
```

**Reason each role exists:**
- Primary green is tied to outreach success (sent, matched, scored). Users associate it with results.
- Accent red is the logo brand mark — it appears in the logo only. Never in body UI.
- Warm cream surface is deliberate: it reduces eye strain for 30+ min sessions and differentiates from blue-tinted "AI tool" competitors.
- No purple, indigo, or gradient text. Those are unchosen defaults.

---

## 7. Motion Principles

### Durations

```
--duration-instant:  100ms  — micro: button press, focus ring
--duration-fast:     150ms  — hover states, badge counts
--duration-normal:   220ms  — menu open/close, tab switch
--duration-enter:    300ms  — page elements entering
--duration-exit:     180ms  — always shorter than enter
--duration-layout:   280ms  — layout changes (Collapse, list reorder)
```

### Easings

```
--ease-out:        cubic-bezier(0.16, 1, 0.3, 1)                       — enters, expansions
--ease-in:         cubic-bezier(0.4, 0, 1, 1)                           — exits, collapses
--ease-inout:      cubic-bezier(0.4, 0, 0.2, 1)                         — layout transitions
--ease-spring:     type: "spring", stiffness: 400, damping: 32          — interactive cards, shared layout
--ease-spring-soft: type: "spring", stiffness: 240, damping: 28         — modals, drawers
```

No bounce easing. No elastic easing. Springs must be critically damped.

### Stagger

```
--stagger-tight:  40ms  — list items (up to 8 items)
--stagger-loose:  60ms  — section reveals (3–4 sections max)
```

### Signature motion per page

| Page | Signature moment |
|---|---|
| Login | The left-panel text cross-fades between promo slides (Motion, not GSAP) |
| Landing | Hero cards enter and float on mount (Motion, replace GSAP) |
| Onboarding | Resume carousel slides in from right on first view |
| ATS Score | Score number rolls from 0 to result via AnimatedNumber |
| Resume Tailor | AI output streams in while container grows with `layout` |
| Applications | Cards animate to new column when stage changes via `layoutId` |
| Cold Mail | Email row collapses out when sent; next row slides up |
| Analytics | Stat numbers animate from 0 on first scroll into view |
| Pricing | Plan cross-fades amount with AnimatePresence |
| Settings | Save button transitions to checkmark on success |

Everything else: short fade (opacity only), 220ms, ease-out. No sliding
elements without a spatial reason.

### Rules

- Wrap app in `<MotionConfig reducedMotion="user">` — the first line in App.tsx.
- Use `LazyMotion` with `domAnimation` features and `m` components everywhere.
- Animate transform + opacity. Never width, height, top, left, margin, padding.
- Use `layout` prop for size changes. Use `Collapse` helper for expand/contract.
- Variants defined outside components (or memoized) — never inline objects.
- `AnimatePresence` with unique stable `key` for all conditional renders.
- `layoutId` for shared-element moves (pipeline cards, selected rows).
- No decorative loops. No `repeat: Infinity` unless showing real-time live status.

---

## 8. Component Set (canonical, no one-off copies)

```
Primitive:   Button (primary | secondary | ghost | text | destructive)
             Input, Textarea, Select, Checkbox, Switch
             Badge, StatusBadge
             Avatar
             Separator

Compound:    Card (surface wrapper, NOT for every content group)
             Modal / Dialog (Elevation 3, AnimatePresence)
             Sheet (side drawer for narrow forms)
             DropdownMenu, ContextMenu (Elevation 2)
             Toast (via Sonner)
             Tabs (animated indicator)
             Table (layout animated rows)
             Skeleton (geometry-matching)
             ProgressBar, Meter

Motion:      PageTransition (route wrapper)
             FadeUp (scroll reveal, once per section)
             Stagger (list container)
             Collapse (height animate)
             Presence (AnimatePresence wrapper with consistent settings)
             AnimatedNumber (count roll)
             SkeletonScreen (content-matched placeholder)
```

---

## 9. Responsive Breakpoints

```
358px — minimum supported width. Single column. All touch targets ≥ 44×44px.
768px — tablet. Two columns where needed. Sidebar hidden, bottom nav shown.
1440px — desktop. Full sidebar + content area. Max content width 1280px.
```

No intermediate breakpoints unless strictly required.
No horizontal scroll on any breakpoint.
Font sizes never shrink below 14px on 358px.
