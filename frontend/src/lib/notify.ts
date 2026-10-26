import { useEffect, useState } from "react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  action?: ToastAction;
  duration?: number;
}

export type ToastType = "success" | "error" | "info" | "warning";

export interface ActiveToast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration: number;
}

function cleanMessage(raw: string): string {
  if (!raw) return "";
  let msg = raw.trim();
  msg = msg.replace(/[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, "");
  msg = msg.replace(/[!.]+$/, "").trim();
  msg = msg.replace(/^successfully\s+/i, "");
  if (!msg) return "";
  return msg.charAt(0).toUpperCase() + msg.slice(1);
}

let toastIdCounter = 0;
let activeToasts: ActiveToast[] = [];
let queuedToasts: ActiveToast[] = [];
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function showToast(type: ToastType, rawMessage: string, options?: ToastOptions): string {
  const message = cleanMessage(rawMessage);
  if (!message) return "";

  const duplicateIndex = activeToasts.findIndex(
    (t) => t.message.toLowerCase() === message.toLowerCase() && t.type === type
  );

  if (duplicateIndex !== -1) {
    return activeToasts[duplicateIndex].id;
  }

  const duration = options?.duration ?? (options?.action ? 5000 : 3000);
  const newToast: ActiveToast = {
    id: `toast-${++toastIdCounter}`,
    message,
    type,
    action: options?.action,
    duration,
  };

  if (activeToasts.length < 3) {
    activeToasts = [...activeToasts, newToast];
  } else {
    queuedToasts = [...queuedToasts, newToast];
  }

  emitChange();
  return newToast.id;
}

function dismissToast(id?: string) {
  if (id) {
    activeToasts = activeToasts.filter((t) => t.id !== id);
    queuedToasts = queuedToasts.filter((t) => t.id !== id);
  } else {
    activeToasts = [];
    queuedToasts = [];
  }

  while (activeToasts.length < 3 && queuedToasts.length > 0) {
    const nextToast = queuedToasts.shift();
    if (nextToast) {
      activeToasts = [...activeToasts, nextToast];
    }
  }

  emitChange();
}

export const notify = {
  success: (message: string, options?: ToastOptions) => showToast("success", message, options),
  error: (message: string, options?: ToastOptions) => showToast("error", message, options),
  info: (message: string, options?: ToastOptions) => showToast("info", message, options),
  warning: (message: string, options?: ToastOptions) => showToast("warning", message, options),
  dismiss: (id?: string) => dismissToast(id),
};

export function useNotifications() {
  const [toasts, setToasts] = useState<ActiveToast[]>(() => activeToasts);

  useEffect(() => {
    const handleUpdate = () => setToasts(activeToasts);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    toasts,
    dismiss: dismissToast,
  };
}
