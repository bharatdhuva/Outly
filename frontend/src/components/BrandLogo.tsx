import { Link } from "react-router-dom";

export function BrandLogo({ className = "", to = "/" }: { className?: string; to?: string }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-[8px] no-underline select-none hover:opacity-80 transition-opacity duration-150 ${className}`}
      aria-label="Outly home"
    >
      <img src="/favicon.png" alt="Outly" className="h-[22px] w-[22px] shrink-0 object-contain rounded-md" />
      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: '#12A394', lineHeight: 1 }}>Outly</span>
    </Link>
  );
}

