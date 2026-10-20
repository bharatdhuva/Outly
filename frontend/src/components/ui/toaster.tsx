import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={3500}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === "destructive";

        return (
          <Toast key={id} variant={variant} {...props} className="group relative flex items-start gap-3 p-4 pr-9">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                isDestructive
                  ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                  : "bg-emerald-50 text-[#2DC08D] border border-emerald-200/60"
              }`}
            >
              {isDestructive ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-left space-y-0.5">
              {title && (
                <ToastTitle className="text-xs font-semibold text-neutral-900 leading-tight">
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-xs text-neutral-500 leading-relaxed font-normal">
                  {description}
                </ToastDescription>
              )}
            </div>

            {action}
            <ToastClose className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 transition-colors p-1" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
