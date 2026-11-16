/**
 * Spinner.tsx
 * Shared spinner — iOS-style 12-blade stepped radial indicator.
 * Spinners go INSIDE buttons only. Never as a full-page loader.
 */

interface SpinnerProps {
  className?: string;
  size?: number;
}

export function Spinner({ className = "text-current", size = 20 }: SpinnerProps) {
  const blades = [
    { deg: 0,   opacity: 1.00 },
    { deg: 30,  opacity: 0.18 },
    { deg: 60,  opacity: 0.25 },
    { deg: 90,  opacity: 0.32 },
    { deg: 120, opacity: 0.40 },
    { deg: 150, opacity: 0.48 },
    { deg: 180, opacity: 0.56 },
    { deg: 210, opacity: 0.64 },
    { deg: 240, opacity: 0.73 },
    { deg: 270, opacity: 0.82 },
    { deg: 300, opacity: 0.90 },
    { deg: 330, opacity: 0.96 },
  ];

  return (
    <svg
      className={`${className} animate-[spin_0.85s_steps(12,end)_infinite] shrink-0`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {blades.map(({ deg, opacity }) => (
        <rect
          key={deg}
          x="10.85"
          y="1.5"
          width="2.3"
          height="5.8"
          rx="1.15"
          opacity={opacity}
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}
