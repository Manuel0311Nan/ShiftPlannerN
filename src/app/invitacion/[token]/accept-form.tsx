"use client";

import { useActionState } from "react";
import { acceptInvitationAction } from "@/app/actions/accept-invitation.action";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export function AcceptForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    acceptInvitationAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nombre" className="text-[14px] text-ink-secondary">
          Tu nombre
        </label>
        <Input id="nombre" name="nombre" required minLength={2} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[14px] text-ink-secondary">
          Contraseña
        </label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>

      {state.error && <p className="text-[14px] text-red-600">{state.error}</p>}

      <Button type="submit" variant="primary" disabled={pending} className="mt-2">
        {pending ? "Creando cuenta…" : "Aceptar invitación"}
      </Button>
    </form>
  );
}
