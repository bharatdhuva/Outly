import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sparkles, Bot, AlertTriangle, Coffee } from "lucide-react";

interface AiErrorModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function AiErrorModal({
  open,
  onClose,
  title = "Oops! Gemini AI Took a Coffee Break ☕",
  message = "We're super sorry! Since Outly is currently running on Google Gemini's free API tier, the AI model just hit its temporary rate limit or request quota.",
}: AiErrorModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <AlertDialogContent className="max-w-[460px] border-border bg-card p-6 shadow-xl rounded-2xl animate-fade-in select-none">
        <AlertDialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Bot className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-bold text-foreground leading-snug">
                {title}
              </AlertDialogTitle>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block mt-1">
                Free Tier Rate Limit
              </span>
            </div>
          </div>

          <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2">
            {message}
            <span className="block mt-2.5 font-medium text-foreground/90 bg-muted/50 p-3 rounded-xl border border-border/60">
              💡 <strong>Quick Fix:</strong> Please wait about 10–15 seconds and try again. The free API quota will reset automatically!
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="pt-4">
          <AlertDialogAction
            onClick={onClose}
            className="w-full bg-outly-accent text-white hover:brightness-110 rounded-full font-semibold h-10 text-xs shadow-md shadow-outly-accent/20 cursor-pointer"
          >
            Got It, I'll Try Again Shortly ⏱️
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AiErrorModal;
