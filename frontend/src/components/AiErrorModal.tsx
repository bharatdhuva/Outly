import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";
import { m } from "motion/react";
import { dur } from "@/lib/motion-tokens";

interface AiErrorModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function AiErrorModal({
  open,
  onClose,
  title = "AI Service Temporarily Busy",
  message = "Outly's analysis engine reached its rate quota. The service window refreshes automatically.",
}: AiErrorModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <AlertDialogContent className="max-w-[440px] border-[#E0DBCF] bg-white p-6 shadow-xl rounded-2xl select-none">
        <AlertDialogHeader className="space-y-4 text-center flex flex-col items-center w-full">
          <div className="flex flex-col items-center gap-3 text-center w-full">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <AlertCircle className="h-6 w-6 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <AlertDialogTitle className="text-base font-semibold text-[#1A1A1A] leading-snug">
                {title}
              </AlertDialogTitle>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6760] bg-outly-border/40 px-2.5 py-0.5 rounded-full inline-block mt-1">
                Temporary Status
              </span>
            </div>
          </div>

          <AlertDialogDescription className="text-xs sm:text-sm text-[#6B6760] leading-relaxed pt-2 text-center w-full">
            {message}
            <span className="block mt-3.5 font-normal text-[#1A1A1A] bg-outly-cream p-3 rounded-xl border border-outly-border text-left">
              Please wait 10–15 seconds and try again. Your data and input have been preserved.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="pt-4 flex justify-center sm:justify-center w-full">
          <AlertDialogAction asChild>
            <m.button
              type="button"
              onClick={onClose}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: dur.instant }}
              className="w-full bg-primary hover:bg-[#25A87A] text-white rounded-full font-medium h-10 text-xs shadow-sm transition-colors cursor-pointer"
            >
              Try Again Shortly
            </m.button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AiErrorModal;
