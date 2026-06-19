"use client";

import { useActionState } from "react";
import { registerOrganizationAction } from "@/app/actions/register-organization.action";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerOrganizationAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="empresaNombre" className="text-[14px] text-ink-secondary">
          Nombre de la empresa
        </label>
        <Input id="empresaNombre" name="empresaNombre" required minLength={2} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="adminNombre" className="text-[14px] text-ink-secondary">
          Tu nombre
        </label>
        <Input id="adminNombre" name="adminNombre" required minLength={2} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="adminEmail" className="text-[14px] text-ink-secondary">
          Email
        </label>
        <Input id="adminEmail" name="adminEmail" type="email" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="adminPassword" className="text-[14px] text-ink-secondary">
          Contraseña
        </label>
        <Input
          id="adminPassword"
          name="adminPassword"
          type="password"
          required
          minLength={8}
        />
      </div>

      {state.error && (
        <p className="text-[14px] text-red-600">{state.error}</p>
      )}

      <Button type="submit" variant="primary" disabled={pending} className="mt-2">
        {pending ? "Creando cuenta…" : "Empezar prueba gratis"}
      </Button>
    </form>
  );
}
