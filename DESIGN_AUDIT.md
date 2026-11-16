# Design Audit — Outly Frontend

> Every page and shared component listed. Slop tells identified per file.
> Status: PENDING (not yet fixed). Will be updated as work progresses.

---

## Shared Components

### `components/PageTransition.tsx`
**States:** active (wrapping), loading bar  
**Tells:**
- Imports from `framer-motion` — must move to `motion/react`
- Progress bar uses a gradient (`from-emerald-400 via-teal-500`) — decorative color, not from token roles
- Gradient bar: should use `--primary` only
- `width` animated via inline style — must use `scaleX` on transform instead

---

### `components/AppSidebar.tsx`
**States:** open, closed (mobile), active nav item, pending badge  
**Tells:**
- Icon hover uses `group-hover:scale-110 group-hover:rotate-3` etc. — defined per nav item. Inconsistent. All icons get one hover: scale(1.05), no rotation.
- No motion for sidebar open/close on mobile — transition is CSS only. Replace with `m.aside` and `AnimatePresence`
- No `Stagger` on nav items entering
- `translate-x-1` on hover of nav links — a janky translate without spring

---

### `components/DashboardLayout.tsx`
**States:** authenticated, unauthenticated redirect, demo mode (countdown banner), premium vs free, loading user data, notifications open/closed, dropdown open/closed, mobile menu open/closed  
**Tells:**
- Imports from `framer-motion` — must migrate to `motion/react`
- `PlanStatusAvatar` uses `bg-gradient-to-tr from-[#ff4e50] via-[#f9d423] to-[#2dc08d]` rainbow gradient ring for premium — decorative gradient, against anti-slop rules. Replace with a solid primary border or a small crown icon.
- `createParticle` function manually appends DOM elements and animates via CSS. Remove entirely — no decoration. Navigation to `/pricing` needs no particle effect.
- Dropdown variants use `scale` on the container — can produce layout shift. Use only `opacity + translateY`.
- Notification title `"Welcome to Outly! 🎉"` and `"Upgraded to Pro! 🚀"` — emoji in content. Remove.
- `Sparkles` icon in import list — used in nav. Replace with product-appropriate icon (or remove).
- `radial-gradient` background blobs in `body` CSS — decorative. Remove.
- `shadow-2xl` on dropdown — too heavy. Use Elevation 2 token.
- Mobile profile menu has no AnimatePresence — pops in without motion.
- Notifications panel has no AnimatePresence — pops without motion.
- `hover:translate-x-0.5` on guide links — micro jank without spring.

---

### `components/DemoSignupModal.tsx`
**States:** demo active (soft prompt), demo expired (blocking), Google loading  
**Tells:**
- `Sparkles` icon used for AI prompt — against anti-slop rules. Use a checkmark or lock icon for context-appropriate signal.
- `rounded-[26px]` custom value — use `--radius-xl` token
- `shadow-[0_24px_70px_rgba(0,0,0,0.22)]` custom value — use Elevation 3 token
- `IosRadialSpinner` duplicated here from `Login.tsx` — extract to shared `Spinner` component
- `confetti` on sign-up: confetti is acceptable only on the login completion (once). Remove from modal sign-up.

---

### `components/LimitReachedModal.tsx`
**States:** open, closed  
**Tells:** (file not yet read — audit pending)
- Likely shares spinner and modal style issues with `DemoSignupModal`

---

### `components/LoadingScreen.tsx`
**States:** loading  
**Tells:** (file not yet read — audit pending)
- Likely uses a spinner + no skeleton match

---

### `components/StatusBadge.tsx`
**States:** various status values  
**Tells:** (audit pending — checking for hardcoded colors)

---

### `components/NavLink.tsx`
**States:** active, inactive, hover  
**Tells:** Wraps react-router Link with activeClassName — check for redundant motion

---

### `components/BrandLogo.tsx`
**States:** default  
**Tells:** Likely just an img — ensure no hardcoded sizing

---

### `components/SearchBar.tsx`
**States:** empty, with query, focused  
**Tells:** Audit pending

---

### `components/ResumeCarousel.tsx`
**States:** items, empty  
**Tells:** Audit pending — likely uses Embla without Motion

---

### `components/LockedFeatureGuard.tsx`
**States:** locked, unlocked  
**Tells:** Audit pending

---

### `components/LoginStageShow.tsx`
**States:** demo stageshow  
**Tells:** Uses stageshow library — may have its own motion system. Check for conflicts.

---

### `components/DotLottieLoader.tsx`
**States:** loading  
**Tells:** Uses Lottie — check if it conflicts with Motion; ensure reduced-motion respected

---

### `components/AiErrorModal.tsx`
**States:** open, closed, error details  
**Tells:** Audit pending

---

### `components/PdfViewer.tsx`
**States:** loading, loaded, error  
**Tells:** Audit pending

---

## Shared UI (Radix/shadcn)

### `components/ui/button.tsx`
**Tells:**
- No press feedback (`whileTap`) — add `scale(0.97)` on press
- No focus visible state beyond default ring

### `components/ui/dialog.tsx`
**Tells:**
- Uses Radix animation classes (tailwindcss-animate) — replace with `AnimatePresence` + `m.div`
- No origin-from-trigger animation (modal should open from trigger element)

### `components/ui/dropdown-menu.tsx`
**Tells:**
- Uses Radix animation classes — replace with Motion AnimatePresence

### `components/ui/badge.tsx`
**Tells:** Hardcoded colors likely — check for token alignment

### `components/ui/tabs.tsx`
**Tells:** No animated tab indicator (sliding underline/pill)

### `components/ui/toast.tsx` / `components/ui/sonner.tsx`
**Tells:** No AnimatePresence — toasts pop without exit animation

### `components/ui/input.tsx`
**Tells:** No `whileFocus` feedback, possibly missing focus-visible ring

### `components/ui/card.tsx`
**Tells:** `rounded-xl shadow-2xs` or similar on all cards — needs radius/shadow tokens

### `components/ui/skeleton.tsx`
**Tells:** Generic shimmer — needs to match content geometry per usage

---

## Pages

### `pages/Login.tsx`
**States:** default, Google loading, demo loading, server waking, demo error  
**Tells:**
- Imports `gsap` for promo slide animation — remove GSAP, replace with `motion/react`
- `Sparkles` icon on "Try Demo" button — against anti-slop rules. Use a play icon or no icon.
- Decorative concentric circles SVG in left panel — decorative shape, no content purpose. Remove.
- `italic text-outly-accent font-serif` on headline last words — italic flourish on headings. Anti-slop.
- `IosRadialSpinner` defined locally — extract to shared Spinner
- `useToast` with emoji in toast titles (`🌌`, `🚀`) — remove emoji from messages
- `animate-fade-in` on error div (CSS animation) — replace with `AnimatePresence`
- Left panel background `#F2EBDD`, right panel `#FAF6F0` — these should use Surface tokens
- `active:scale-[0.98]` via CSS class — replace with `whileTap`

---

### `pages/Landing.tsx`
**States:** logged-out (default), logged-in (redirects), tabs: brief/inbox/calendar/vault, inbox: list/detail, vault roles, job tracker stages, search results, pricing toggle  
**Tells:**
- Imports `framer-motion` — migrate to `motion/react`
- Imports `gsap` — remove entirely. Replace with Motion.
- Infinite floating GSAP animations (`repeat: -1`) on hero cards — decorative loops without cause. Remove the float. Keep only the entrance animation.
- `confetti` on "Send" in the inbox demo — confetti in an interactive demo is acceptable (it represents a sent email), but it fires on `handleSendDraft`. Keep but verify it respects reduced-motion.
- `confetti` on add-to-tracker — remove. This is a secondary action.
- Hero typing animation is a custom interval loop — keep but wrap in a cleanup correctly.
- `Sparkles` icon used in multiple places — replace.
- Filler animated countdown timer on pricing — this is a fake urgency pattern ("3d 00h 00m 00s"). Replace with static "Limited offer" or remove.
- Multiple `gsap.to(panel, opacity/y)` for tab switches — replace with AnimatePresence.
- `radial-gradient` blobs in page backgrounds — decorative.
- `hero-tag`, `hero-title`, `hero-subtitle` classes with GSAP `.fromTo` — replace with Motion stagger.
- `feature-cards` with identical style and identical layout — anti-slop. Vary the layout rhythm.

---

### `pages/Onboarding.tsx`
**States:** default view, loading  
**Tells:**
- Inline `<style>` block with keyframe animations — replace with Motion variants
- `radial-gradient` background mesh — decorative blobs. Remove.
- `blur(10px)` in `onboard-enter` animation — animating filter is acceptable only as a supported exception; must be removed if it causes jank
- `Star` icon imported — check usage
- `animate: onboard-enter 0.8s` etc — replace with Motion variants on `m.div`

---

### `pages/AtsScore.tsx`
**States:** no resume uploaded, uploading, analyzing, results (score + breakdown), error, limit reached  
**Tells:** (audit pending — large file)
- Likely has score displayed statically — needs AnimatedNumber
- Likely has hardcoded colors for score bands

---

### `pages/ResumeTailor.tsx`
**States:** no JD, analyzing, streaming AI output, done, error, limit reached  
**Tells:** (audit pending — large file)
- AI output likely rendered statically — needs streaming + container growth via `layout`
- Likely has loading spinner (not skeleton)

---

### `pages/ResumeVault.tsx`
**States:** empty, loading, list of resumes, delete confirm  
**Tells:** (audit pending)
- Empty state likely generic
- No stagger on list entrance

---

### `pages/ColdMail.tsx`
**States:** no companies, loading, list of companies (pending/sent/failed), sending, error  
**Tells:** (audit pending)
- Row removal: likely instant (no AnimatePresence)
- No stagger on list entrance

---

### `pages/Applications.tsx`
**States:** empty per column, loading, kanban with cards, card detail modal, add modal, delete confirm, stage move  
**Tells:**
- Stage move: no `layoutId` animation — cards jump to new column instantly
- `color: "#6366f1"` for Saved stage — unchosen purple. Use neutral or token-based colors.
- `bg: "#eef2ff"` — purple-tinted background. Remove.
- `CompanyLogo` falls back to `initial` in colored square — anti-slop (letter in colored square). Use initials in a neutral rounded badge.
- No stagger on cards entering

---

### `pages/JobSearch.tsx`
**States:** empty, loading, results, no-results  
**Tells:** (audit pending)

---

### `pages/Analytics.tsx`
**States:** loading, loaded with stats  
**Tells:** (audit pending)
- Numbers likely static — need AnimatedNumber on first view

---

### `pages/Pricing.tsx`
**States:** free tier, pro tier, billing toggle, currency toggle  
**Tells:** (audit pending)
- Fake countdown timer (from Landing pattern) — confirm if present here too; remove if so

---

### `pages/Settings.tsx`
**States:** loading, loaded, saving, saved, error  
**Tells:** (audit pending)
- Save button likely has no success state animation

---

### `pages/Support.tsx`
**States:** default, form submitted  
**Tells:** (audit pending)

---

### `pages/Logs.tsx`
**States:** empty, loading, list of log entries  
**Tells:** (audit pending)
- No stagger on list entrance likely

---

### `pages/NotFound.tsx`
**States:** 404  
**Tells:** (audit pending)
- Likely generic. Needs a clear redirect action.

---

### `pages/MobileHub.tsx`
**States:** tabs: resumes/jobs/tools  
**Tells:** (audit pending)
- Animated tab switch needed

---

## Summary of Cross-Cutting Tells

| Category | Count | Priority |
|---|---|---|
| `framer-motion` imports to migrate to `motion/react` | 4+ files | P0 |
| GSAP usage to replace with Motion | Login, Landing, DashboardLayout | P0 |
| Decorative infinite loops (floating cards) | Landing | P0 |
| Sparkles icon on AI features | Login, DemoSignupModal, DashboardLayout | P0 |
| Emoji in notification/toast content | DashboardLayout, Login, DemoSignupModal | P0 |
| Gradient decorative elements (blobs, rainbow ring) | DashboardLayout, body CSS | P1 |
| Fake urgency countdown timer | Landing, possibly Pricing | P1 |
| Purple/indigo stage colors | Applications | P1 |
| `IosRadialSpinner` duplicated in 2+ files | Login, DemoSignupModal | P1 |
| No AnimatePresence on conditional renders | Modal, Toast, Notifications | P1 |
| No `layoutId` on pipeline cards | Applications | P1 |
| No AnimatedNumber on stat displays | Analytics, AtsScore, Sidebar | P2 |
| CSS keyframe animations instead of Motion | Onboarding, Login error div | P2 |
| Identical card style on every section | Landing features section | P2 |
| Missing skeleton states | Most pages use spinners | P2 |

---

## Build Order

1. **Motion infrastructure** — tokens, LazyMotion setup, shared motion wrappers  
2. **Shared components** — Spinner, Skeleton, Button (with whileTap), Dialog/Modal (with AnimatePresence), Toast, Badge  
3. **Login page** — reference page, shown for review before proceeding  
4. **DashboardLayout + AppSidebar** — affects every dashboard page  
5. **Onboarding** — first page after login  
6. **Applications** — most motion-critical (layoutId)  
7. **ATS Score** — AnimatedNumber signature  
8. **Resume Tailor** — streaming layout animation  
9. **Cold Mail** — row collapse animation  
10. **Resume Vault, Job Search, Analytics** — stagger + AnimatedNumber  
11. **Pricing, Settings, Support, Logs** — lighter motion  
12. **Landing** — most complex (GSAP removal, tabs, inbox)  
13. **NotFound, MobileHub** — cleanup  
