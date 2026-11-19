import { Send } from "lucide-react";
import { Link } from "react-router-dom";

export function BrandLogo({ className = "", to = "/" }: { className?: string; to?: string }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-[8px] no-underline select-none hover:opacity-80 transition-opacity duration-150 ${className}`}
      aria-label="Outly home"
    >
      <Send size={20} strokeWidth={1.8} className="shrink-0 text-[#12A394]" />
      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: '#12A394', lineHeight: 1 }}>Outly</span>
    </Link>
  );
}

