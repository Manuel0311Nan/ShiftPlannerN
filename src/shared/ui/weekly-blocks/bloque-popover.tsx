"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Field, FieldLabel, FieldError } from "@/shared/ui/field";
import { Stepper } from "@/shared/ui/stepper";
import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { DIAS_SEMANA_OPCIONES } from "@/shared/kernel/dias-semana-labels";
import { FranjaPresetButtons } from "./franja-preset";
import type { BloqueSemanal } from "./types";

export function BloquePopoverContent({
  bloque,
  diaSemana,
  mostrarNombre,
  mostrarPersonas,
  esNuevo,
  onGuardar,
  onEliminar,
  onCopiarADias,
  onClose,
}: {
  bloque: BloqueSemanal;
  diaSemana: DiaSemana;
  mostrarNombre: boolean;
  mostrarPersonas: boolean;
  esNuevo: boolean;
  onGuardar: (bloque: BloqueSemanal) => string | null;
  onEliminar?: () => void;
  onCopiarADias: (bloque: BloqueSemanal, dias: DiaSemana[]) => string | null;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<BloqueSemanal>(bloque);
  const [diasSeleccionados, setDiasSeleccionados] = useState<DiaSemana[]>([]);
  const [error, setError] = useState<string | null>(null);

  const otrosDias = DIAS_SEMANA_OPCIONES.filter((d) => d.value !== diaSemana);

  function guardar() {
    const err = onGuardar(draft);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  function copiar() {
    if (diasSeleccionados.length === 0) return;
    const err = onCopiarADias(draft, diasSeleccionados);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <div className="flex flex-col gap-3">
      <FranjaPresetButtons
        onSelect={(preset) =>
          setDraft((d) => ({ ...d, ...preset.rangos[0] }))
        }
      />

      {mostrarNombre && (
        <Field>
          <FieldLabel>Nombre</FieldLabel>
          <Input
            value={draft.nombre ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
            placeholder="Turno de mañana"
          />
        </Field>
      )}

      <div className="flex items-end gap-2">
        <Field className="flex-1">
          <FieldLabel>Hora inicio</FieldLabel>
          <Input
            type="time"
            step={1800}
            value={draft.horaInicio}
            onChange={(e) => setDraft((d) => ({ ...d, horaInicio: e.target.value }))}
          />
        </Field>
        <Field className="flex-1">
          <FieldLabel>Hora fin</FieldLabel>
          <Input
            type="time"
            step={1800}
            value={draft.horaFin}
            onChange={(e) => setDraft((d) => ({ ...d, horaFin: e.target.value }))}
          />
        </Field>
      </div>

      {mostrarPersonas && (
        <Field>
          <FieldLabel>Personas requeridas</FieldLabel>
          <Stepper
            value={draft.personasRequeridas ?? 1}
            onChange={(value) => setDraft((d) => ({ ...d, personasRequeridas: value }))}
          />
        </Field>
      )}

      {error && <FieldError>{error}</FieldError>}

      <div className="flex items-center justify-between border-t border-hairline pt-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="primary" className="px-4 py-1.5 text-sm" onClick={guardar}>
            {esNuevo ? "Añadir" : "Guardar"}
          </Button>
          {!esNuevo && onEliminar && (
            <button
              type="button"
              onClick={onEliminar}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          )}
        </div>
      </div>

      <details className="rounded-md border border-hairline">
        <summary className="cursor-pointer px-2.5 py-2 text-xs font-medium text-ink-muted">
          Copiar a otros días
        </summary>
        <div className="flex flex-col gap-2 px-2.5 pb-2.5">
          <div className="flex flex-wrap gap-2">
            {otrosDias.map((dia) => (
              <label key={dia.value} className="flex items-center gap-1 text-xs text-ink-secondary">
                <input
                  type="checkbox"
                  checked={diasSeleccionados.includes(dia.value)}
                  onChange={(e) =>
                    setDiasSeleccionados((prev) =>
                      e.target.checked
                        ? [...prev, dia.value]
                        : prev.filter((v) => v !== dia.value),
                    )
                  }
                />
                {dia.label}
              </label>
            ))}
          </div>
          <Button
            type="button"
            variant="utility"
            className="w-fit px-2.5 py-1 text-xs"
            disabled={diasSeleccionados.length === 0}
            onClick={copiar}
          >
            Copiar bloque
          </Button>
        </div>
      </details>
    </div>
  );
}
