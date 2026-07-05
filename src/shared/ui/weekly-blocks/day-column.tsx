"use client";

import { useState } from "react";
import { Copy, Plus } from "lucide-react";
import { IconButton } from "@/shared/ui/icon-button";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { DIAS_SEMANA_OPCIONES } from "@/shared/kernel/dias-semana-labels";
import { BloqueCard } from "./bloque-card";
import { BloquePopoverContent } from "./bloque-popover";
import { AddBloquePopoverContent } from "./add-bloque-popover";
import type { BloqueSemanal } from "./types";

function minutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function BloqueItem({
  bloque,
  diaSemana,
  mostrarNombre,
  mostrarPersonas,
  onActualizar,
  onEliminar,
  onCopiarADias,
}: {
  bloque: BloqueSemanal;
  diaSemana: DiaSemana;
  mostrarNombre: boolean;
  mostrarPersonas: boolean;
  onActualizar: (bloque: BloqueSemanal) => string | null;
  onEliminar: () => void;
  onCopiarADias: (bloque: BloqueSemanal, dias: DiaSemana[]) => string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger nativeButton={false} render={<BloqueCard bloque={bloque} />} />
      <PopoverContent>
        <BloquePopoverContent
          bloque={bloque}
          diaSemana={diaSemana}
          mostrarNombre={mostrarNombre}
          mostrarPersonas={mostrarPersonas}
          esNuevo={false}
          onGuardar={onActualizar}
          onEliminar={() => {
            onEliminar();
            setOpen(false);
          }}
          onCopiarADias={onCopiarADias}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

export function DayColumn({
  dia,
  bloques,
  mostrarNombre,
  mostrarPersonas,
  onAgregar,
  onActualizar,
  onEliminar,
  onCopiarBloqueADias,
  onCopiarDiaADias,
}: {
  dia: (typeof DIAS_SEMANA_OPCIONES)[number];
  bloques: BloqueSemanal[];
  mostrarNombre: boolean;
  mostrarPersonas: boolean;
  onAgregar: (bloques: Omit<BloqueSemanal, "id" | "diaSemana">[]) => string | null;
  onActualizar: (id: string, bloque: Omit<BloqueSemanal, "id" | "diaSemana">) => string | null;
  onEliminar: (id: string) => void;
  onCopiarBloqueADias: (bloque: Omit<BloqueSemanal, "id" | "diaSemana">, dias: DiaSemana[]) => string | null;
  onCopiarDiaADias: (dias: DiaSemana[]) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [diasCopia, setDiasCopia] = useState<DiaSemana[]>([]);

  const totalHoras = bloques.reduce(
    (acc, b) => acc + (minutos(b.horaFin) - minutos(b.horaInicio)) / 60,
    0,
  );
  const totalPersonas = mostrarPersonas
    ? bloques.reduce((acc, b) => acc + (b.personasRequeridas ?? 0), 0)
    : undefined;

  const otrosDias = DIAS_SEMANA_OPCIONES.filter((d) => d.value !== dia.value);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{dia.label}</p>
          <p className="text-[11px] text-ink-faint">
            {totalHoras}h
            {totalPersonas !== undefined
              ? ` · ${totalPersonas} ${totalPersonas === 1 ? "persona" : "personas"}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Popover open={copyOpen} onOpenChange={setCopyOpen}>
            <PopoverTrigger
              render={
                <IconButton label="Copiar día a otros días" variant="ghost" size="sm" disabled={bloques.length === 0}>
                  <Copy size={14} />
                </IconButton>
              }
            />
            <PopoverContent className="w-64">
              <p className="mb-2 text-xs font-medium text-ink-muted">Copiar {dia.label} a…</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                  <input
                    type="checkbox"
                    checked={diasCopia.length === otrosDias.length}
                    onChange={(e) => setDiasCopia(e.target.checked ? otrosDias.map((d) => d.value) : [])}
                  />
                  Toda la semana
                </label>
                <div className="flex flex-wrap gap-2">
                  {otrosDias.map((d) => (
                    <label key={d.value} className="flex items-center gap-1 text-xs text-ink-secondary">
                      <input
                        type="checkbox"
                        checked={diasCopia.includes(d.value)}
                        onChange={(e) =>
                          setDiasCopia((prev) =>
                            e.target.checked ? [...prev, d.value] : prev.filter((v) => v !== d.value),
                          )
                        }
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="utility"
                  className="w-fit px-2.5 py-1 text-xs"
                  disabled={diasCopia.length === 0}
                  onClick={() => {
                    onCopiarDiaADias(diasCopia);
                    setDiasCopia([]);
                    setCopyOpen(false);
                  }}
                >
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger
              render={
                <IconButton label="Añadir bloque" variant="ghost" size="sm">
                  <Plus size={14} />
                </IconButton>
              }
            />
            <PopoverContent>
              <AddBloquePopoverContent
                mostrarNombre={mostrarNombre}
                mostrarPersonas={mostrarPersonas}
                onAgregarRangos={(rangos) =>
                  onAgregar(
                    rangos.map((rango) => ({
                      ...rango,
                      nombre: mostrarNombre ? "Turno" : undefined,
                      personasRequeridas: mostrarPersonas ? 1 : undefined,
                    })),
                  )
                }
                onAgregarManual={(bloque) => onAgregar([bloque])}
                onClose={() => setAddOpen(false)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {bloques.map((bloque) => (
          <BloqueItem
            key={bloque.id}
            bloque={bloque}
            diaSemana={dia.value}
            mostrarNombre={mostrarNombre}
            mostrarPersonas={mostrarPersonas}
            onActualizar={(cambios) => onActualizar(bloque.id, cambios)}
            onEliminar={() => onEliminar(bloque.id)}
            onCopiarADias={(cambios, dias) => onCopiarBloqueADias(cambios, dias)}
          />
        ))}
        {bloques.length === 0 && <p className="text-xs text-ink-faint">Sin turnos</p>}
      </div>
    </div>
  );
}
