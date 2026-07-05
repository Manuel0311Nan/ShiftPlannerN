"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const ToastProvider = BaseToast.Provider;
export const useToast = BaseToast.useToastManager;

function ToastList() {
  const { toasts } = useToast();

  return toasts.map((toast) => (
    <BaseToast.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "absolute inset-x-0 top-0 rounded-md border border-hairline bg-surface-raised p-4 shadow-lg transition-all",
        "data-[type=error]:border-destructive/40",
        "data-[type=success]:border-accent-green/40",
        "data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0",
        "data-[ending-style]:opacity-0",
      )}
      style={{
        transform: `translateY(calc(var(--toast-index) * -4px)) scale(calc(1 - var(--toast-index) * 0.05))`,
        zIndex: "calc(1000 - var(--toast-index))",
      }}
    >
      <BaseToast.Title className="text-sm font-medium text-ink" />
      <BaseToast.Description className="mt-1 text-sm text-ink-muted" />
      <BaseToast.Close
        className="absolute right-2 top-2 rounded-sm p-1 text-ink-faint hover:bg-canvas-soft hover:text-ink"
        aria-label="Cerrar"
      >
        <X className="size-3.5" />
      </BaseToast.Close>
    </BaseToast.Root>
  ));
}

export function Toaster() {
  return (
    <BaseToast.Portal>
      <BaseToast.Viewport className="fixed bottom-4 right-4 z-100 w-[min(24rem,calc(100vw-2rem))]">
        <ToastList />
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
}
