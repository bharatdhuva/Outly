import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-wc': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        autoplay?: boolean;
        loop?: boolean;
        style?: React.CSSProperties;
      }, HTMLElement>;
    }
  }
}

interface DotLottieLoaderProps {
  src?: string;
  size?: number;
  message?: string;
  minHeight?: string;
}

export function DotLottieLoader({
  size = 50,
  message = "",
  minHeight = "min-h-[250px]",
}: DotLottieLoaderProps) {
  // Clamp spinner visual size to a reasonable range
  const visualSize = Math.max(32, Math.min(size, 80));

  return (
    <div className={`flex flex-col items-center justify-center ${minHeight} w-full py-10 px-4 animate-fade-in select-none`}>
      <div className="relative flex items-center justify-center">
        {/* Glow effect in the background */}
        <div 
          className="absolute rounded-full bg-outly-accent/10 blur-xl animate-pulse"
          style={{ width: `${visualSize * 1.5}px`, height: `${visualSize * 1.5}px` }}
        />
        
        {/* Modern Custom SVG Spinner */}
        <svg
          className="animate-spin"
          width={visualSize}
          height={visualSize}
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Track circle (subtle background) */}
          <circle
            cx="25"
            cy="25"
            r="20"
            stroke="currentColor"
            className="text-muted/10"
            strokeWidth="4"
          />
          {/* Animated loader stroke with gradient */}
          <circle
            cx="25"
            cy="25"
            r="20"
            stroke="url(#loader-gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="125"
            strokeDashoffset="80"
          />
          <defs>
            <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#2dc08d" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {message && (
        <div className="mt-4 text-xs font-semibold text-muted-foreground tracking-wide bg-card border border-border/80 px-4 py-1.5 rounded-full shadow-sm">
          {message}
        </div>
      )}
    </div>
  );
}

export default DotLottieLoader;
