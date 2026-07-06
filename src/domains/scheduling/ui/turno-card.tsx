"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { TurnoPopover } from "./turno-popover";
import { colorFranja, horaDe, type EmpleadoVista, type TurnoVista } from "./board-utils";

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

  const cuerpo = (
    <>
      <div className="flex items-center gap-1.5">
        {!readOnly && <GripVertical className="size-3.5 shrink-0 opacity-50" />}
        <span className="truncate font-semibold">{turno.usuarioNombre}</span>
      </div>
      <span className="tabular-nums">
        {horaDe(turno.inicioIso)}–{horaDe(turno.finIso)}
      </span>
      {turno.origen === "manual" && (
        <span className="w-fit rounded-full bg-fuchsia-plum-soft px-1.5 text-[10px] font-semibold text-fuchsia-plum">
          manual
        </span>
      )}
    </>
  );

  if (readOnly) {
    return (
      <div
        className={cn(
          "flex flex-col gap-0.5 rounded-md border px-2.5 py-2 text-xs",
          colorFranja(turno.inicioIso),
        )}
      >
        {cuerpo}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-1 rounded-md border px-2.5 py-2 text-xs shadow-sm",
        colorFranja(turno.inicioIso),
        isDragging && "opacity-40",
      )}
    >
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Translate.toString(transform) }}
        className="flex flex-1 cursor-grab flex-col gap-0.5 touch-none active:cursor-grabbing"
        {...listeners}
        {...attributes}
      >
        {cuerpo}
      </div>
      <TurnoPopover
        turno={turno}
        empleados={empleados}
        onEditarHoras={onEditarHoras}
        onReasignar={onReasignar}
        onBorrar={onBorrar}
      />
    </div>
  );
}
