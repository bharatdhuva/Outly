/**
 * vitals.ts — Real User Monitoring (RUM) for Core Web Vitals
 * Zero-dependency, lightweight observer for LCP, INP, and CLS.
 */

interface Metric {
  name: "LCP" | "INP" | "CLS" | "FCP";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

function getRating(name: Metric["name"], value: number): Metric["rating"] {
  switch (name) {
    case "LCP":
      return value <= 2000 ? "good" : value <= 4000 ? "needs-improvement" : "poor";
    case "INP":
      return value <= 200 ? "good" : value <= 500 ? "needs-improvement" : "poor";
    case "CLS":
      return value <= 0.1 ? "good" : value <= 0.25 ? "needs-improvement" : "poor";
    case "FCP":
      return value <= 1800 ? "good" : value <= 3000 ? "needs-improvement" : "poor";
  }
}

function reportMetric(metric: Metric) {
  // Log in dev or send beacon to telemetry endpoint in production
  if (process.env.NODE_ENV === "development") {
    // console.debug(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  }
  
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const payload = JSON.stringify({
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      path: window.location.pathname,
      timestamp: Date.now(),
    });
    // Send to existing analytics if configured
    try {
      navigator.sendBeacon("/api/analytics/vitals", payload);
    } catch {
      // Non-blocking beacon failure
    }
  }
}

export function initWebVitals() {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  // 1. Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        reportMetric({
          name: "LCP",
          value: lastEntry.startTime,
          rating: getRating("LCP", lastEntry.startTime),
        });
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}

  // 2. Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      reportMetric({
        name: "CLS",
        value: clsValue,
        rating: getRating("CLS", clsValue),
      });
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });
  } catch {}

  // 3. Interaction to Next Paint (INP)
  try {
    let maxDuration = 0;
    const inpObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (entry.duration && entry.duration > maxDuration) {
          maxDuration = entry.duration;
          reportMetric({
            name: "INP",
            value: maxDuration,
            rating: getRating("INP", maxDuration),
          });
        }
      }
    });
    inpObserver.observe({ type: "event", buffered: true, durationThreshold: 40 } as any);
  } catch {}
}
