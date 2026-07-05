"use client";

import { WeeklyBlocksEditor } from "@/shared/ui/weekly-blocks/weekly-blocks-editor";

export function PlantillaEditor() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-secondary">Horario semanal del local</p>
      <WeeklyBlocksEditor name="plantilla" mostrarNombre mostrarPersonas />
    </div>
  );
}
