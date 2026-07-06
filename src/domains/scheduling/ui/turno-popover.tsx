"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { horaDe, type EmpleadoVista, type TurnoVista } from "./board-utils";

export function TurnoPopover({
  turno,
  empleados,
  onEditarHoras,
  onReasignar,
  onBorrar,
}: {
  turno: TurnoVista;
  empleados: EmpleadoVista[];
  onEditarHoras: (horaInicio: string, horaFin: string) => void;
  onReasignar: (usuarioId: string) => void;
  onBorrar: () => void;
}) {
  const [horaInicio, setHoraInicio] = useState(horaDe(turno.inicioIso));
  const [horaFin, setHoraFin] = useState(horaDe(turno.finIso));

  return (
    <Popover>
      <PopoverTrigger
        render={
          <IconButton
            label="Editar turno"
            size="sm"
            className="shrink-0 bg-surface/60"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Pencil />
          </IconButton>
        }
      />
      <PopoverContent className="w-72">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">{turno.usuarioNombre}</p>
            <p className="text-xs text-ink-muted">Editar turno</p>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor="turno-inicio">Inicio</Label>
              <Input
                id="turno-inicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor="turno-fin">Fin</Label>
              <Input
                id="turno-fin"
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
              />
            </div>
          </div>
          <PopoverClose
            render={
              <Button
                type="button"
                variant="utility"
                onClick={() => onEditarHoras(horaInicio, horaFin)}
              >
                Guardar horas
              </Button>
            }
          />

          <div className="flex flex-col gap-1">
            <Label htmlFor="turno-empleado">Empleado</Label>
            <Select
              value={turno.usuarioId}
              onValueChange={(value) => {
                if (value && value !== turno.usuarioId) onReasignar(String(value));
              }}
            >
              <SelectTrigger id="turno-empleado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {empleados.map((empleado) => (
                  <SelectItem key={empleado.id} value={empleado.id}>
                    {empleado.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <PopoverClose
            render={
              <Button
                type="button"
                variant="ghost"
                className="justify-start gap-2 text-destructive hover:bg-destructive/10"
                onClick={onBorrar}
              >
                <Trash2 className="size-4" />
                Borrar turno
              </Button>
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
