"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { alertaError, confirmar, toastExito } from "@/shared/ui/alert";
import type { ActionResult } from "@/shared/kernel/action-result";

/**
 * Botón de borrado con confirmación vía SweetAlert. Recibe una Server Action y
 * su input; al confirmar la ejecuta y, si va bien, redirige a `redirectTo`.
 */
export function ConfirmDeleteButton<TInput>({
  action,
  input,
  confirmTitle,
  confirmDescription,
  label = "Eliminar",
  redirectTo,
  successMessage = "Eliminado correctamente",
}: {
  action: (input: TInput) => Promise<ActionResult<unknown>>;
  input: TInput;
  confirmTitle: string;
  confirmDescription: string;
  label?: string;
  redirectTo: string;
  successMessage?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    const confirmado = await confirmar({
      titulo: confirmTitle,
      texto: confirmDescription,
      confirmar: "Sí, eliminar",
      peligro: true,
    });
    if (!confirmado) return;

    startTransition(async () => {
      const result = await action(input);
      if (result.success) {
        toastExito(successMessage);
        router.push(redirectTo);
        router.refresh();
      } else {
        alertaError(result.error.message);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      className="text-destructive hover:bg-destructive/10"
      loading={pending}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}
