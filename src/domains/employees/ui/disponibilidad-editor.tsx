"use client";

import { WeeklyBlocksEditor } from "@/shared/ui/weekly-blocks/weekly-blocks-editor";

export function DisponibilidadEditor() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-secondary">Disponibilidad semanal</p>
      <WeeklyBlocksEditor name="disponibilidad" mostrarNombre={false} mostrarPersonas={false} />
    </div>
  );
}
