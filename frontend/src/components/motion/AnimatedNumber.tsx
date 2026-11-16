/**
 * AnimatedNumber.tsx
 * Rolls a numeric value from its previous value to the new one.
 * Uses motion's animate() imperative API so there's no DOM thrash.
 */
import { useEffect, useRef } from "react";
import { animate } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  /** Format the displayed number */
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toString(),
  className,
  duration = 0.6,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from = prevRef.current;
    const to = value;
    prevRef.current = value;

    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        if (el) el.textContent = format(latest);
      },
    });

    return () => controls.stop();
  }, [value, duration, format]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
