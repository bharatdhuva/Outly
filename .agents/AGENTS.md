# Project-Specific Behavioral Rules (Outly)

To maintain a cohesive and polished user experience, all subsequent modifications and feature implementations must strictly follow the guidelines below.

## 🎨 1. Design & Styling Alignment
* **Theme & Colors:** Always use the existing CSS variables defined in `frontend/src/index.css`. Never introduce arbitrary hex codes or colors. Use:
  * `--background`, `--foreground`
  * `--card`, `--card-foreground`
  * `--popover`, `--popover-foreground`
  * `--primary`, `--primary-foreground`
  * `--muted`, `--muted-foreground`
  * `--accent`, `--accent-foreground`
  * `--border`, `--input`, `--ring`
  * `--success`, `--warning`, `--destructive`
* **Typography:** Use the project's standard fonts: `Inter` for general text/headings and `JetBrains Mono` (via `.font-mono` class) for code, data, logs, or technical values.
* **Borders & Corners:** Keep all rounded corners matching `--radius` (which is `0.625rem` or `rounded-lg`). All borders must use standard `border-border` colors.

## 🚨 2. Dialogs, Alerts, and Popups
* **Component Reuse:** Always reuse the established Shadcn UI components located in `frontend/src/components/ui/`.
  * For modals: Use `Dialog` or `AlertDialog` components.
  * For toasts/notifications: Use `toast` / `use-toast.ts` or standard `sonner` components.
  * For inline warnings/info: Use the `Alert` component.
* **Aesthetics:** Modal contents must match the current look:
  * Use `<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px] border-border bg-card">` or `<AlertDialogContent className="border-border bg-card">`.
  * Do not add extra visual noise, heavy gradients, or glowing effects to dialogs or popups.
  * Align primary and secondary actions with the standard button variants (`default`, `secondary`, `outline`, `destructive`).

## ⚖️ 3. Avoid Over-Designing
* **Simplicity & Functionality First:** Do not over-complicate UI elements. Maintain a clean, professional, and minimal aesthetic.
* **No Unnecessary Fluff:** Avoid introducing fancy custom animations, high-intensity gradients, glowing shadows, or complex multi-pane layouts unless explicitly requested.
* **Hover & Interactive States:** Minor interactive states (hover transitions, active clicks, focus borders) should use standard subtle transitions (`transition-all duration-200`) and match the rest of the application's interactive feel.
