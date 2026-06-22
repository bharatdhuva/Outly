import logoIcon from "@/assets/lightlogo.png";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src={logoIcon} alt="Outly logo" className="h-8 w-8 shrink-0 object-contain" />
      <div className="flex items-end gap-1">
        <span className="brand-wordmark text-[1.45rem] leading-none text-foreground">
          Outly
        </span>
        <span className="mb-0 h-1.5 w-1.5 rounded-full bg-primary" />
      </div>
    </div>
  );
}
