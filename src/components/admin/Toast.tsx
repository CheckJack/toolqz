"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { ToastAlert3, type ToastAlertVariant } from "@/components/ui/alert-3";

type ToastType = ToastAlertVariant;

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastOptions {
  description?: string;
  action?: ToastAction;
  duration?: number;
}

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType, options?: ToastOptions) => void;
}>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success", options?: ToastOptions) => {
      const id = Date.now() + Math.random();
      const duration = options?.duration ?? (options?.action ? 5000 : 4000);
      setToasts((prev) => [
        ...prev,
        {
          id,
          title: message,
          description: options?.description,
          type,
          action: options?.action,
        },
      ]);
      setTimeout(() => {
        dismiss(id);
      }, duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed left-4 right-4 top-[3.75rem] z-[100] flex flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:top-auto sm:w-[min(100vw-2rem,22rem)]">
        {toasts.map((t) => (
          <ToastAlert3
            key={t.id}
            title={t.title}
            description={t.description}
            variant={t.type}
            onDismiss={() => dismiss(t.id)}
            action={
              t.action
                ? {
                    label: t.action.label,
                    onClick: () => {
                      t.action?.onClick();
                      dismiss(t.id);
                    },
                  }
                : undefined
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
