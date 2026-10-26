import { notify, useNotifications, type ToastAction, type ToastOptions } from "@/lib/notify";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: ToastAction;
  duration?: number;
}

export function toast({ title, description, variant, action, duration }: ToastProps) {
  const message = title || description || "";
  const options: ToastOptions = { action, duration };

  if (variant === "destructive") {
    return notify.error(message, options);
  }
  return notify.success(message, options);
}

export function useToast() {
  const { toasts, dismiss } = useNotifications();

  return {
    toasts,
    toast,
    dismiss,
  };
}

export { notify };
