"use client";

import { useState } from "react";
import { Stepper } from "@/shared/ui/stepper";
import { TIPOS_TURNO, TIPO_TURNO_LABEL, type TipoTurno } from "@/shared/kernel/tipo-turno";

const AYUDA: Record<TipoTurno, string> = {
  APERTURA: "Turnos en el primer bloque del día",
  CIERRE: "Turnos en el último bloque del día",
  PARTIDO: "Días con dos o más bloques",
};

/**
 * Mínimos semanales por tipo de turno que el horario generado deberá cumplir.
 * Serializa a `<input hidden name="condiciones">` con `[{ tipo, minimo }]`,
 * en paralelo a la disponibilidad. Mínimo 0 = sin condición.
 */
export function CondicionesEditor() {
  const [minimos, setMinimos] = useState<Record<TipoTurno, number>>({
    APERTURA: 0,
    CIERRE: 0,
    PARTIDO: 0,
  });

  const serializado = TIPOS_TURNO.map((tipo) => ({ tipo, minimo: minimos[tipo] }));

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm text-ink-secondary">Condiciones semanales</p>
        <p className="text-xs text-ink-faint">
          Mínimos que el horario generado debe cumplir para este trabajador.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface p-3">
        {TIPOS_TURNO.map((tipo) => (
          <div key={tipo} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">{TIPO_TURNO_LABEL[tipo]}</p>
              <p className="text-[11px] text-ink-faint">{AYUDA[tipo]}</p>
            </div>
            <Stepper
              value={minimos[tipo]}
              min={0}
              max={7}
              onChange={(value) => setMinimos((prev) => ({ ...prev, [tipo]: value }))}
            />
          </div>
        ))}
      </div>

      <input type="hidden" name="condiciones" value={JSON.stringify(serializado)} readOnly />
    </div>
  );
}
