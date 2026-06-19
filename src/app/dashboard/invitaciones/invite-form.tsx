"use client";

import { useActionState, useState } from "react";
import { inviteUserAction } from "@/app/actions/invite-user.action";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Manager = { id: string; nombre: string };

export function InviteForm({
  viewerRol,
  managers,
  initialRol,
  initialManagerId,
}: {
  viewerRol: "ADMIN" | "MANAGER";
  managers: Manager[];
  initialRol: "MANAGER" | "EMPLOYEE";
  initialManagerId: string;
}) {
  const [state, formAction, pending] = useActionState(inviteUserAction, {});
  const [rol, setRol] = useState<"MANAGER" | "EMPLOYEE">(initialRol);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[14px] text-ink-secondary">
          Email
        </label>
        <Input id="email" name="email" type="email" required />
      </div>

      {viewerRol === "ADMIN" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rol" className="text-[14px] text-ink-secondary">
            Rol
          </label>
          <select
            id="rol"
            name="rol"
            value={rol}
            onChange={(e) => setRol(e.target.value as "MANAGER" | "EMPLOYEE")}
            className="w-full rounded-xs border border-[#dddddd] bg-surface px-3 py-2.5 text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="MANAGER">Manager</option>
            <option value="EMPLOYEE">Trabajador</option>
          </select>
        </div>
      ) : (
        <input type="hidden" name="rol" value="EMPLOYEE" />
      )}

      {rol === "EMPLOYEE" && viewerRol === "ADMIN" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="managerId" className="text-[14px] text-ink-secondary">
            Manager
          </label>
          <select
            id="managerId"
            name="managerId"
            required
            defaultValue={initialManagerId}
            className="w-full rounded-xs border border-[#dddddd] bg-surface px-3 py-2.5 text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="" disabled>
              Selecciona un manager
            </option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {state.error && <p className="text-[14px] text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-[14px] text-accent-green">Invitación enviada.</p>
      )}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Enviando…" : "Enviar invitación"}
      </Button>
    </form>
  );
}
