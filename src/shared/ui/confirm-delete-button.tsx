"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import type { ActionResult } from "@/shared/kernel/action-result";

/**
 * Botón de borrado con confirmación inline. Recibe una Server Action y su
 * input; al confirmar la ejecuta y, si va bien, redirige a `redirectTo`.
 */
export function ConfirmDeleteButton<TInput>({
  action,
  input,
  confirmTitle,
  confirmDescription,
  label = "Eliminar",
  redirectTo,
}: {
  action: (input: TInput) => Promise<ActionResult<unknown>>;
  input: TInput;
  confirmTitle: string;
  confirmDescription: string;
  label?: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await action(input);
      if (result.success) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        className="text-destructive hover:bg-destructive/10"
        onClick={() => setConfirming(true)}
      >
        {label}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-4">
      <p className="text-[15px] font-medium text-ink">{confirmTitle}</p>
      <p className="text-[14px] text-ink-muted">{confirmDescription}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button variant="danger" loading={pending} onClick={handleDelete}>
          Sí, eliminar
        </Button>
        <Button
          variant="utility"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
