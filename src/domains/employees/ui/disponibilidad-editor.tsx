"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DIAS_SEMANA_OPCIONES } from "@/shared/kernel/dias-semana-labels";

type Bloque = {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
};

export function DisponibilidadEditor() {
  const [bloques, setBloques] = useState<Bloque[]>([]);

  function agregarBloque(diaSemana: string) {
    setBloques((prev) => [...prev, { diaSemana, horaInicio: "09:00", horaFin: "17:00" }]);
  }

  function actualizarBloque(index: number, cambios: Partial<Bloque>) {
    setBloques((prev) =>
      prev.map((bloque, i) => (i === index ? { ...bloque, ...cambios } : bloque)),
    );
  }

  function eliminarBloque(index: number) {
    setBloques((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] text-ink-secondary">Disponibilidad semanal</p>
      {DIAS_SEMANA_OPCIONES.map((dia) => (
        <div key={dia.value} className="flex flex-col gap-2 rounded-md border border-hairline p-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-ink">{dia.label}</span>
            <button
              type="button"
              onClick={() => agregarBloque(dia.value)}
              className="inline-flex items-center gap-1 text-[13px] text-primary"
            >
              <Plus size={14} /> Añadir bloque
            </button>
          </div>
          {bloques
            .map((bloque, index) => ({ bloque, index }))
            .filter(({ bloque }) => bloque.diaSemana === dia.value)
            .map(({ bloque, index }) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={bloque.horaInicio}
                  onChange={(e) => actualizarBloque(index, { horaInicio: e.target.value })}
                  className="rounded-xs border border-[#dddddd] px-2 py-1 text-[14px]"
                />
                <span className="text-ink-faint">–</span>
                <input
                  type="time"
                  value={bloque.horaFin}
                  onChange={(e) => actualizarBloque(index, { horaFin: e.target.value })}
                  className="rounded-xs border border-[#dddddd] px-2 py-1 text-[14px]"
                />
                <button
                  type="button"
                  onClick={() => eliminarBloque(index)}
                  className="text-ink-faint hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </div>
      ))}
      <input type="hidden" name="disponibilidad" value={JSON.stringify(bloques)} readOnly />
    </div>
  );
}
