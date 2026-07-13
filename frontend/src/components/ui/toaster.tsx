import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={3000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex items-center gap-1.5 justify-center w-full">
              {title && <ToastTitle className="text-xs font-semibold">{title}</ToastTitle>}
              {title && description && <span className="opacity-60 text-[10px]">•</span>}
              {description && <ToastDescription className="text-xs opacity-90">{description}</ToastDescription>}
            </div>
            {action}
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
