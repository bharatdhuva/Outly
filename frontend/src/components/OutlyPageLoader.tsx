import { Loader2 } from "lucide-react";
import logoTransparent from "@/assets/brand/logo_transparent.png";

interface OutlyPageLoaderProps {
  message?: string;
  minHeight?: string;
}

export function OutlyPageLoader({
  message = "Syncing Outly Workspace...",
  minHeight = "min-h-[450px]"
}: OutlyPageLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${minHeight} w-full py-16 px-4 animate-fade-in`}>
      <div className="relative flex items-center justify-center mb-6">
        {/* Glowing pulse aura behind logo */}
        <div className="absolute inset-0 rounded-full bg-outly-accent/25 blur-xl animate-pulse scale-150" />
        
        <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-md flex items-center justify-center">
          <img 
            src={logoTransparent} 
            alt="Outly Logo" 
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain animate-bounce" 
            style={{ animationDuration: "2.2s" }} 
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 bg-secondary/60 border border-border/80 px-4 py-2 rounded-full shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-outly-accent" />
        <span className="text-xs font-semibold text-foreground tracking-wide">{message}</span>
      </div>
    </div>
  );
}

export default OutlyPageLoader;
