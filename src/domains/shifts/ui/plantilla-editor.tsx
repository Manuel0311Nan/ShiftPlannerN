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
      <p className="text-xs text-ink-faint">
        Los turnos pueden solaparse: en las horas compartidas se suma la gente que
        pide cada uno.
      </p>
      <WeeklyBlocksEditor
        name="plantilla"
        mostrarNombre
        mostrarPersonas
        permitirSolape
        bloquesIniciales={bloquesIniciales}
      />
    </div>
  );
}
