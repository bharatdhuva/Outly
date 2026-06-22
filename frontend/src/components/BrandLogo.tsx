import logoIcon from "@/assets/lightlogo.png";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <img src={logoIcon} alt="Outly" className="h-9 w-auto object-contain" />
    </div>
  );
}
