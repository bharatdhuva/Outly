import logoIcon from "@/assets/lightlogo.png";
import { Link } from "react-router-dom";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center ${className} hover:opacity-90 transition-opacity`}>
      <img src={logoIcon} alt="Outly" className="h-9 w-auto object-contain cursor-pointer" />
    </Link>
  );
}

