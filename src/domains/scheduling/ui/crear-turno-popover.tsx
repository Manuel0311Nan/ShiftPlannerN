"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { FieldError } from "@/shared/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { EmpleadoVista } from "./board-utils";

export function CrearTurnoPopoverContent({
  empleados,
  onCrear,
  onClose,
}: {
  empleados: EmpleadoVista[];
  onCrear: (usuarioId: string, horaInicio: string, horaFin: string) => void;
  onClose: () => void;
}) {
  const [usuarioId, setUsuarioId] = useState(empleados[0]?.id ?? "");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("17:00");
  const [error, setError] = useState<string | null>(null);

  function crear() {
    if (!usuarioId) {
      setError("Selecciona un empleado");
      return;
    }
    if (horaFin <= horaInicio) {
      setError("La hora de fin debe ser posterior al inicio");
      return;
    }
    onCrear(usuarioId, horaInicio, horaFin);
    onClose();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-ink">Nuevo turno</p>

      <div className="flex flex-col gap-1">
        <Label htmlFor="crear-empleado">Empleado</Label>
        <Select value={usuarioId} onValueChange={(v) => setUsuarioId(String(v ?? ""))}>
          <SelectTrigger id="crear-empleado">
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

      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="crear-inicio">Inicio</Label>
          <Input
            id="crear-inicio"
            type="time"
            step={1800}
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="crear-fin">Fin</Label>
          <Input
            id="crear-fin"
            type="time"
            step={1800}
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
          />
        </div>
      </div>

      {error && <FieldError>{error}</FieldError>}

      <Button type="button" variant="primary" className="px-4 py-1.5 text-sm" onClick={crear}>
        Añadir turno
      </Button>
    </div>
  );
}
