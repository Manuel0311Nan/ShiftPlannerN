"use client";

import { useActionState } from "react";
import { updateUserAction } from "@/app/actions/update-user.action";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function EditManagerForm({
  usuarioId,
  nombre,
  email,
}: {
  usuarioId: string;
  nombre: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(updateUserAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="usuarioId" value={usuarioId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" required minLength={2} defaultValue={nombre} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required defaultValue={email} />
        <p className="text-[13px] text-ink-faint">
          Si cambias el email, se lo notificamos al manager en la nueva
          dirección. Su contraseña no cambia.
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-accent-green">Cambios guardados.</p>
      )}

      <Button type="submit" variant="primary" loading={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
