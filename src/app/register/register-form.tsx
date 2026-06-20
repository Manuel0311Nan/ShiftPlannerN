"use client";

import { useState } from "react";
import { useActionState } from "react";
import { registerOrganizationAction } from "@/app/actions/register-organization.action";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PlantillaEditor } from "@/domains/shifts/ui/plantilla-editor";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerOrganizationAction,
    {},
  );
  const [esManager, setEsManager] = useState(false);

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

      <label className="flex items-center gap-2 text-[14px] text-ink-secondary">
        <input
          type="checkbox"
          name="esManager"
          checked={esManager}
          onChange={(e) => setEsManager(e.target.checked)}
        />
        ¿Vas a gestionar tú mismo un local?
      </label>

      {esManager && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="localNombre" className="text-[14px] text-ink-secondary">
            Nombre del local
          </label>
          <Input id="localNombre" name="localNombre" required minLength={2} />
        </div>
      )}
      {esManager && <PlantillaEditor />}

      {state.error && (
        <p className="text-[14px] text-red-600">{state.error}</p>
      )}

      <Button type="submit" variant="primary" disabled={pending} className="mt-2">
        {pending ? "Creando cuenta…" : "Empezar prueba gratis"}
      </Button>
    </form>
  );
}
