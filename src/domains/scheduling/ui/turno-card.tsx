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
  morning: { block: "border-deep-sky-blue bg-deep-sky-blue-soft", label: "text-deep-sky-blue" },
  afternoon: { block: "border-cool-horizon bg-cool-horizon-soft", label: "text-cool-horizon" },
  night: { block: "border-fuchsia-plum bg-fuchsia-plum-soft", label: "text-fuchsia-plum" },
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
        <span className="mt-1 w-fit rounded-full bg-fuchsia-plum-soft px-1.5 text-[10px] font-semibold text-fuchsia-plum">
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
