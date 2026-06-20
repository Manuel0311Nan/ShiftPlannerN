"use client";

import { useActionState, useState } from "react";
import { createUserAction } from "@/app/actions/create-user.action";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PlantillaEditor } from "@/domains/shifts/ui/plantilla-editor";
import { DisponibilidadEditor } from "@/domains/employees/ui/disponibilidad-editor";

type Manager = { id: string; nombre: string; locales: { id: string; nombre: string }[] };

export function CreateUserForm({
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
  const [state, formAction, pending] = useActionState(createUserAction, {});
  const [rol, setRol] = useState<"MANAGER" | "EMPLOYEE">(initialRol);
  const [managerId, setManagerId] = useState(initialManagerId);

  const managerSeleccionado =
    viewerRol === "MANAGER" ? managers[0] : managers.find((m) => m.id === managerId);
  const locales = managerSeleccionado?.locales ?? [];

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nombre" className="text-[14px] text-ink-secondary">
          Nombre
        </label>
        <Input id="nombre" name="nombre" required minLength={2} />
      </div>

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
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
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

      {rol === "EMPLOYEE" && locales.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="localId" className="text-[14px] text-ink-secondary">
            Local
          </label>
          <select
            id="localId"
            name="localId"
            required
            className="w-full rounded-xs border border-[#dddddd] bg-surface px-3 py-2.5 text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="" disabled>
              Selecciona un local
            </option>
            {locales.map((local) => (
              <option key={local.id} value={local.id}>
                {local.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {rol === "MANAGER" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="localNombre" className="text-[14px] text-ink-secondary">
            Nombre del local
          </label>
          <Input id="localNombre" name="localNombre" required minLength={2} />
        </div>
      )}

      {rol === "MANAGER" && <PlantillaEditor />}
      {rol === "EMPLOYEE" && <DisponibilidadEditor />}

      {state.error && <p className="text-[14px] text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-[14px] text-accent-green">
          Cuenta creada. Le enviamos las credenciales por email.
        </p>
      )}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Creando…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
