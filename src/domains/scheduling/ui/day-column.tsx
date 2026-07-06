"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/shared/ui/icon-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { CrearTurnoPopoverContent } from "./crear-turno-popover";
import { TurnoCard } from "./turno-card";
import type { EmpleadoVista, TurnoVista } from "./board-utils";

export function DayColumn({
  indice,
  label,
  fecha,
  turnos,
  empleados,
  requeridas,
  readOnly,
  onEditarHoras,
  onReasignar,
  onBorrar,
  onCrear,
}: {
  indice: number;
  label: string;
  fecha: Date;
  turnos: TurnoVista[];
  empleados: EmpleadoVista[];
  requeridas: number;
  readOnly: boolean;
  onEditarHoras: (turnoId: string, horaInicio: string, horaFin: string) => void;
  onReasignar: (turnoId: string, usuarioId: string) => void;
  onBorrar: (turnoId: string) => void;
  onCrear: (indice: number, usuarioId: string, horaInicio: string, horaFin: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: `dia-${indice}`, disabled: readOnly });

  const faltan = requeridas - turnos.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-40 flex-col gap-2 rounded-lg border border-hairline bg-surface p-3 transition-colors",
        isOver && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="text-[11px] text-ink-faint tabular-nums">
            {fecha.getDate()}/{fecha.getMonth() + 1}
            {requeridas > 0 &&
              (faltan > 0 ? (
                <span className="text-accent-orange-deep"> · faltan {faltan}</span>
              ) : (
                <span> · {turnos.length}</span>
              ))}
          </p>
        </div>
        {!readOnly && empleados.length > 0 && (
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger
              render={
                <IconButton label="Añadir turno" variant="ghost" size="sm">
                  <Plus size={14} />
                </IconButton>
              }
            />
            <PopoverContent className="w-72">
              <CrearTurnoPopoverContent
                empleados={empleados}
                onCrear={(usuarioId, horaInicio, horaFin) =>
                  onCrear(indice, usuarioId, horaInicio, horaFin)
                }
                onClose={() => setAddOpen(false)}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {turnos.map((turno) => (
          <TurnoCard
            key={turno.id}
            turno={turno}
            empleados={empleados}
            readOnly={readOnly}
            onEditarHoras={(horaInicio, horaFin) => onEditarHoras(turno.id, horaInicio, horaFin)}
            onReasignar={(usuarioId) => onReasignar(turno.id, usuarioId)}
            onBorrar={() => onBorrar(turno.id)}
          />
        ))}
        {turnos.length === 0 && (
          <p className="py-4 text-center text-xs text-ink-faint">Sin turnos</p>
        )}
      </div>
    </div>
  );
}
