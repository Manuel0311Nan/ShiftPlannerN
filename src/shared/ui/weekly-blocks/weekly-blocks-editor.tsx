"use client";

import { useState } from "react";
import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { DIAS_SEMANA_OPCIONES } from "@/shared/kernel/dias-semana-labels";
import { DayColumn } from "./day-column";
import { minutos, seSuperponen } from "./solapamiento";
import type { BloqueSemanal } from "./types";

type NuevoBloque = Omit<BloqueSemanal, "id" | "diaSemana">;

const diaLabel = (dia: DiaSemana) =>
  DIAS_SEMANA_OPCIONES.find((d) => d.value === dia)?.label ?? dia;

function crearId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function hayConflicto(existentes: BloqueSemanal[], candidato: NuevoBloque, excluirId?: string): boolean {
  return existentes.some((b) => b.id !== excluirId && seSuperponen(b, candidato));
}

export function WeeklyBlocksEditor({
  name,
  mostrarNombre,
  mostrarPersonas,
  bloquesIniciales = [],
}: {
  name: string;
  mostrarNombre: boolean;
  mostrarPersonas: boolean;
  bloquesIniciales?: (NuevoBloque & { diaSemana: DiaSemana })[];
}) {
  const [bloques, setBloques] = useState<BloqueSemanal[]>(
    bloquesIniciales.map((b) => ({ ...b, id: crearId() })),
  );

  function agregarBloques(dia: DiaSemana, nuevos: NuevoBloque[]): string | null {
    for (const n of nuevos) {
      if (minutos(n.horaFin) <= minutos(n.horaInicio)) {
        return "La hora de fin debe ser posterior a la de inicio";
      }
    }
    const bloquesDia = bloques.filter((b) => b.diaSemana === dia);
    const candidatos = [...bloquesDia];
    for (const n of nuevos) {
      if (hayConflicto(candidatos, n)) {
        return `El bloque se solapa con otro turno de ${diaLabel(dia)}`;
      }
      candidatos.push({ ...n, id: "tmp", diaSemana: dia });
    }
    setBloques((prev) => [...prev, ...nuevos.map((n) => ({ ...n, id: crearId(), diaSemana: dia }))]);
    return null;
  }

  function actualizarBloque(id: string, cambios: NuevoBloque): string | null {
    const actual = bloques.find((b) => b.id === id);
    if (!actual) return "Turno no encontrado";
    if (minutos(cambios.horaFin) <= minutos(cambios.horaInicio)) {
      return "La hora de fin debe ser posterior a la de inicio";
    }
    const bloquesDia = bloques.filter((b) => b.diaSemana === actual.diaSemana && b.id !== id);
    if (hayConflicto(bloquesDia, cambios, id)) {
      return `El bloque se solapa con otro turno de ${diaLabel(actual.diaSemana)}`;
    }
    setBloques((prev) => prev.map((b) => (b.id === id ? { ...b, ...cambios } : b)));
    return null;
  }

  function eliminarBloque(id: string) {
    setBloques((prev) => prev.filter((b) => b.id !== id));
  }

  function copiarBloqueADias(bloque: NuevoBloque, dias: DiaSemana[]): string | null {
    for (const dia of dias) {
      const bloquesDia = bloques.filter((b) => b.diaSemana === dia);
      if (hayConflicto(bloquesDia, bloque)) {
        return `El bloque se solapa con otro turno de ${diaLabel(dia)}`;
      }
    }
    setBloques((prev) => [
      ...prev,
      ...dias.map((dia) => ({ ...bloque, id: crearId(), diaSemana: dia })),
    ]);
    return null;
  }

  function copiarDiaADias(diaOrigen: DiaSemana, diasDestino: DiaSemana[]) {
    const bloquesOrigen = bloques.filter((b) => b.diaSemana === diaOrigen);
    setBloques((prev) => [
      ...prev.filter((b) => !diasDestino.includes(b.diaSemana)),
      ...diasDestino.flatMap((dia) =>
        bloquesOrigen.map((b) => ({ ...b, id: crearId(), diaSemana: dia })),
      ),
    ]);
  }

  const totalHoras = bloques.reduce(
    (acc, b) => acc + (minutos(b.horaFin) - minutos(b.horaInicio)) / 60,
    0,
  );
  const totalPersonas = mostrarPersonas
    ? bloques.reduce((acc, b) => acc + (b.personasRequeridas ?? 0), 0)
    : undefined;

  const serializado = bloques.map((b) => {
    const out: Record<string, unknown> = {
      diaSemana: b.diaSemana,
      horaInicio: b.horaInicio,
      horaFin: b.horaFin,
    };
    if (mostrarNombre) out.nombre = b.nombre ?? "";
    if (mostrarPersonas) out.personasRequeridas = b.personasRequeridas ?? 1;
    return out;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-md bg-canvas-soft px-3 py-2 text-xs text-ink-secondary">
        <span>Total semana: {totalHoras}h</span>
        {totalPersonas !== undefined && <span>{totalPersonas} personas-turno</span>}
      </div>
      <div className="@container">
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @2xl:grid-cols-4 @5xl:grid-cols-7">
          {DIAS_SEMANA_OPCIONES.map((dia) => (
            <DayColumn
              key={dia.value}
              dia={dia}
              bloques={bloques.filter((b) => b.diaSemana === dia.value)}
              mostrarNombre={mostrarNombre}
              mostrarPersonas={mostrarPersonas}
              onAgregar={(nuevos) => agregarBloques(dia.value, nuevos)}
              onActualizar={actualizarBloque}
              onEliminar={eliminarBloque}
              onCopiarBloqueADias={copiarBloqueADias}
              onCopiarDiaADias={(dias) => copiarDiaADias(dia.value, dias)}
            />
          ))}
        </div>
      </div>
      <input type="hidden" name={name} value={JSON.stringify(serializado)} readOnly />
    </div>
  );
}
