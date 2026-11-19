/**
 * prefetch.ts — Route and resource prefetching
 * Loads chunks on hover/focus and on requestIdleCallback so clicks feel instant.
 */

const prefetched = new Set<string>();

export function prefetchRoute(route: string) {
  if (prefetched.has(route)) return;
  prefetched.add(route);

  switch (route) {
    case "/login":
      import("../pages/Login");
      break;
    case "/onboarding":
    case "/dashboard":
      import("../pages/Onboarding");
      break;
    case "/pricing":
      import("../pages/Pricing");
      break;
    case "/ats-score":
      import("../pages/AtsScore");
      break;
    case "/resume-tailor":
      import("../pages/ResumeTailor");
      break;
    case "/applications":
      import("../pages/Applications");
      break;
    case "/cold-mail":
      import("../pages/ColdMail");
      break;
    case "/job-search":
      import("../pages/JobSearch");
      break;
    case "/resume-vault":
      import("../pages/ResumeVault");
      break;
  }
}

/** Prefetch candidate routes after page load when browser is idle */
export function prefetchOnIdle(routes: string[]) {
  if (typeof window === "undefined") return;
  const run = () => {
    routes.forEach((r) => prefetchRoute(r));
  };
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(run, { timeout: 2500 });
  } else {
    setTimeout(run, 1500);
  }
}
