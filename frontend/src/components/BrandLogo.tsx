import logoTitle from "@/assets/logo-title.png";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <img src={logoTitle} alt="Outly" className="h-10 w-auto object-contain" />
    </div>
  );
}
