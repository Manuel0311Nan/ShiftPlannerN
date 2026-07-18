"use client";

import { useActionState, useState } from "react";
import { updateUserAction } from "@/app/actions/update-user.action";
import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { DisponibilidadEditor } from "@/domains/employees/ui/disponibilidad-editor";

type Manager = {
  id: string;
  nombre: string;
  locales: { id: string; nombre: string }[];
};

type BloqueDisponibilidad = {
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
};

export function EditEmployeeForm({
  usuarioId,
  viewerRol,
  nombre,
  email,
  managers,
  initialManagerId,
  initialLocalId,
  disponibilidadIniciales,
  initialHorasContrato,
}: {
  usuarioId: string;
  viewerRol: "ADMIN" | "MANAGER";
  nombre: string;
  email: string;
  managers: Manager[];
  initialManagerId: string;
  initialLocalId: string;
  disponibilidadIniciales: BloqueDisponibilidad[];
  initialHorasContrato: number;
}) {
  const [state, formAction, pending] = useActionState(updateUserAction, {});
  const [managerId, setManagerId] = useState(initialManagerId);
  const [localId, setLocalId] = useState(initialLocalId);

  const managerSeleccionado =
    viewerRol === "MANAGER"
      ? managers[0]
      : managers.find((m) => m.id === managerId);
  const locales = managerSeleccionado?.locales ?? [];

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
          Si cambias el email, se lo notificamos al trabajador en la nueva
          dirección. Su contraseña no cambia.
        </p>
      </div>

      {viewerRol === "ADMIN" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="managerId">Manager</Label>
          <Select
            name="managerId"
            required
            value={managerId}
            onValueChange={(value) => {
              setManagerId(value ?? "");
              setLocalId("");
            }}
          >
            <SelectTrigger id="managerId">
              <SelectValue placeholder="Selecciona un manager" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {locales.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="localId">Local</Label>
          <Select
            name="localId"
            required
            value={localId}
            onValueChange={(value) => setLocalId(value ?? "")}
          >
            <SelectTrigger id="localId">
              <SelectValue placeholder="Selecciona un local" />
            </SelectTrigger>
            <SelectContent>
              {locales.map((local) => (
                <SelectItem key={local.id} value={local.id}>
                  {local.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="horasContrato">Horas de contrato (semanales)</Label>
        <Input
          id="horasContrato"
          name="horasContrato"
          type="number"
          min={1}
          max={40}
          required
          defaultValue={initialHorasContrato}
          className="w-32"
        />
        <p className="text-[13px] text-ink-faint">
          Mínimo que el horario intenta cumplir y tope de horas asignadas
          (máximo legal 40h).
        </p>
      </div>

      <DisponibilidadEditor bloquesIniciales={disponibilidadIniciales} />

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
