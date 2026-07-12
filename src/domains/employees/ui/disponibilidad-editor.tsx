"use client";

import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { WeeklyBlocksEditor } from "@/shared/ui/weekly-blocks/weekly-blocks-editor";

type BloqueInicial = {
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
};

export function DisponibilidadEditor({
  bloquesIniciales,
}: {
  bloquesIniciales?: BloqueInicial[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-secondary">Disponibilidad semanal</p>
      <WeeklyBlocksEditor
        name="disponibilidad"
        mostrarNombre={false}
        mostrarPersonas={false}
        bloquesIniciales={bloquesIniciales}
      />
    </div>
  );
}
