"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { TurnoPopover } from "./turno-popover";
import {
  FRANJA_LABEL,
  franjaDe,
  horaDe,
  type Franja,
  type EmpleadoVista,
  type TurnoVista,
} from "./board-utils";

const FRANJA_STYLES: Record<Franja, { block: string; label: string }> = {
  morning: { block: "border-shift-morning bg-shift-morning-soft", label: "text-shift-morning" },
  afternoon: { block: "border-shift-afternoon bg-shift-afternoon-soft", label: "text-shift-afternoon" },
  night: { block: "border-shift-night bg-shift-night-soft", label: "text-shift-night" },
};

export function TurnoCard({
  turno,
  empleados,
  readOnly,
  onEditarHoras,
  onReasignar,
  onBorrar,
}: {
  turno: TurnoVista;
  empleados: EmpleadoVista[];
  readOnly: boolean;
  onEditarHoras: (horaInicio: string, horaFin: string) => void;
  onReasignar: (usuarioId: string) => void;
  onBorrar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: turno.id,
    disabled: readOnly,
  });

  const franja = franjaDe(turno.inicioIso);
  const styles = FRANJA_STYLES[franja];

  const cuerpo = (
    <>
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wider",
          styles.label,
        )}
      >
        {FRANJA_LABEL[franja]}
      </span>
      <span className="mt-0.5 truncate text-[13px] font-semibold text-ink">
        {turno.usuarioNombre}
      </span>
      <span className="text-[12px] tabular-nums text-ink-muted">
        {horaDe(turno.inicioIso)} — {horaDe(turno.finIso)}
      </span>
      {turno.origen === "manual" && (
        <span className="mt-1 w-fit rounded-full bg-shift-night-soft px-1.5 text-[10px] font-semibold text-shift-night">
          manual
        </span>
      )}
    </>
  );

  const base = "flex flex-col rounded-lg border-l-[3px] px-2.5 py-2 transition-transform";

  if (readOnly) {
    return <div className={cn(base, styles.block)}>{cuerpo}</div>;
  }

  return (
    <div
      className={cn(
        base,
        styles.block,
        "shadow-sm hover:-translate-y-0.5",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div
          ref={setNodeRef}
          style={{ transform: CSS.Translate.toString(transform) }}
          className="flex flex-1 cursor-grab flex-col touch-none active:cursor-grabbing"
          {...listeners}
          {...attributes}
        >
          {cuerpo}
        </div>
        <div className="flex shrink-0 items-center">
          <GripVertical className="size-3.5 text-ink-faint" />
          <TurnoPopover
            turno={turno}
            empleados={empleados}
            onEditarHoras={onEditarHoras}
            onReasignar={onReasignar}
            onBorrar={onBorrar}
          />
        </div>
      </div>
    </div>
  );
}
