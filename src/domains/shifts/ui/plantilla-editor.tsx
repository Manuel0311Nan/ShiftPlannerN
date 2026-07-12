"use client";

import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { WeeklyBlocksEditor } from "@/shared/ui/weekly-blocks/weekly-blocks-editor";

type BloqueInicial = {
  diaSemana: DiaSemana;
  nombre?: string;
  horaInicio: string;
  horaFin: string;
  personasRequeridas?: number;
};

export function PlantillaEditor({
  bloquesIniciales,
}: {
  bloquesIniciales?: BloqueInicial[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-secondary">Horario semanal del local</p>
      <WeeklyBlocksEditor
        name="plantilla"
        mostrarNombre
        mostrarPersonas
        bloquesIniciales={bloquesIniciales}
      />
    </div>
  );
}
