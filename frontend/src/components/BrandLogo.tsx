import logoIcon from "@/assets/jobos-logo-icon.svg";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src={logoIcon} alt="Outly logo" className="h-10 w-10 shrink-0" />
      <div className="flex items-end gap-1">
        <span className="brand-wordmark text-[1.8rem] leading-none text-white">
          Outly
        </span>
        <span className="mb-0 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(24_95%_53%/0.65)]" />
      </div>
    </div>
  );
}
