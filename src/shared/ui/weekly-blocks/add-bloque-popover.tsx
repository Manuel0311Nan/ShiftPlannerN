"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Field, FieldLabel, FieldError } from "@/shared/ui/field";
import { Stepper } from "@/shared/ui/stepper";
import { FranjaPresetButtons } from "./franja-preset";
import type { BloqueSemanal } from "./types";

export function AddBloquePopoverContent({
  mostrarNombre,
  mostrarPersonas,
  onAgregarRangos,
  onAgregarManual,
  onClose,
}: {
  mostrarNombre: boolean;
  mostrarPersonas: boolean;
  onAgregarRangos: (rangos: { horaInicio: string; horaFin: string }[]) => string | null;
  onAgregarManual: (bloque: Omit<BloqueSemanal, "id" | "diaSemana">) => string | null;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState("Turno");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("17:00");
  const [personasRequeridas, setPersonasRequeridas] = useState(1);
  const [error, setError] = useState<string | null>(null);

  function agregarManual() {
    const err = onAgregarManual({ nombre, horaInicio, horaFin, personasRequeridas });
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  function seleccionarPreset(rangos: { horaInicio: string; horaFin: string }[]) {
    const err = onAgregarRangos(rangos);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <div className="flex flex-col gap-3">
      <FranjaPresetButtons onSelect={(preset) => seleccionarPreset(preset.rangos)} />

      <div className="flex flex-col gap-3 border-t border-hairline pt-3">
        <p className="text-xs font-medium text-ink-muted">Bloque personalizado</p>
        {mostrarNombre && (
          <Field>
            <FieldLabel>Nombre</FieldLabel>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Turno" />
          </Field>
        )}
        <div className="flex items-end gap-2">
          <Field className="flex-1">
            <FieldLabel>Hora inicio</FieldLabel>
            <Input type="time" step={1800} value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </Field>
          <Field className="flex-1">
            <FieldLabel>Hora fin</FieldLabel>
            <Input type="time" step={1800} value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
          </Field>
        </div>
        {mostrarPersonas && (
          <Field>
            <FieldLabel>Personas requeridas</FieldLabel>
            <Stepper value={personasRequeridas} onChange={setPersonasRequeridas} />
          </Field>
        )}
        {error && <FieldError>{error}</FieldError>}
        <Button type="button" variant="primary" className="px-4 py-1.5 text-sm" onClick={agregarManual}>
          Añadir
        </Button>
      </div>
    </div>
  );
}
