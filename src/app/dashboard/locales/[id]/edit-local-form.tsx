"use client";

import { useActionState } from "react";
import { updateLocalAction } from "@/app/actions/update-local.action";
import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PlantillaEditor } from "@/domains/shifts/ui/plantilla-editor";

type BloquePlantilla = {
  diaSemana: DiaSemana;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  personasRequeridas: number;
};

export function EditLocalForm({
  localId,
  nombre,
  plantillaIniciales,
}: {
  localId: string;
  nombre: string;
  plantillaIniciales: BloquePlantilla[];
}) {
  const [state, formAction, pending] = useActionState(updateLocalAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="localId" value={localId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">Nombre del local</Label>
        <Input id="nombre" name="nombre" required minLength={2} defaultValue={nombre} />
      </div>

      <PlantillaEditor bloquesIniciales={plantillaIniciales} />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-accent-green">Horario del local actualizado.</p>
      )}

      <Button type="submit" variant="primary" loading={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
