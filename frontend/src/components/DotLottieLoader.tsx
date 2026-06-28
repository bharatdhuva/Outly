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
  src = "https://lottie.host/f9db9402-abd5-4c78-89bd-d6de6e0405cd/F3ylcW82SW.lottie",
  size = 200,
  message = "",
  minHeight = "min-h-[250px]",
}: DotLottieLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${minHeight} w-full py-10 px-4 animate-fade-in select-none`}>
      <div className="relative flex items-center justify-center">
        <dotlottie-wc
          src={src}
          style={{ width: `${size}px`, height: `${size}px` }}
          autoplay
          loop
        />
      </div>

      {message && (
        <div className="-mt-3 text-xs font-semibold text-muted-foreground tracking-wide bg-card border border-border/80 px-4 py-1.5 rounded-full shadow-sm">
          {message}
        </div>
      )}
    </div>
  );
}

export default DotLottieLoader;
