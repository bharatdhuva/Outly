import logoIcon from "@/assets/brand/outly_your_career_at_peak.png";
import { Link } from "react-router-dom";

export function BrandLogo({ className = "", to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={`flex items-center ${className} hover:opacity-90 transition-opacity`}>
      <img src={logoIcon} alt="Outly" className="h-9 w-auto object-contain cursor-pointer" />
    </Link>
  );
}

