"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { moveTurnoAction } from "@/app/actions/move-turno.action";
import { updateTurnoAction } from "@/app/actions/update-turno.action";
import { createTurnoAction } from "@/app/actions/create-turno.action";
import { deleteTurnoAction } from "@/app/actions/delete-turno.action";
import type { ActionResult } from "@/shared/kernel/action-result";
import { EmptyState } from "@/shared/ui/empty-state";
import { ToastProvider, Toaster, useToast } from "@/shared/ui/toast";
import { DayColumn } from "./day-column";
import {
  DIAS,
  conHora,
  moverADia,
  toLocalDateTime,
  type EmpleadoVista,
  type TurnoVista,
} from "./board-utils";

type BoardProps = {
  localId: string;
  semanaInicio: string; // "YYYY-MM-DD" (lunes)
  turnos: TurnoVista[];
  empleados: EmpleadoVista[];
  requeridasPorDia: number[];
  readOnly: boolean;
};

function parsearLunes(semanaInicio: string): Date {
  const [año, mes, dia] = semanaInicio.split("-").map(Number);
  return new Date(año, mes - 1, dia);
}

function BoardInner({
  localId,
  semanaInicio,
  turnos: turnosProp,
  empleados,
  requeridasPorDia,
  readOnly,
}: BoardProps) {
  const toast = useToast();
  const [turnos, setTurnos] = useState<TurnoVista[]>(turnosProp);
  const tempIdRef = useRef(0);

  // El servidor es la fuente de verdad: tras revalidar (una acción con éxito)
  // llegan turnos nuevos por props y se re-sincroniza el estado optimista.
  // Patrón recomendado: ajustar estado en render al cambiar la prop, no en efecto.
  const propsKey = useMemo(() => JSON.stringify(turnosProp), [turnosProp]);
  const [prevKey, setPrevKey] = useState(propsKey);
  if (propsKey !== prevKey) {
    setPrevKey(propsKey);
    setTurnos(turnosProp);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const lunes = parsearLunes(semanaInicio);

  function notificarResultado<T>(res: ActionResult<T>): boolean {
    if (!res.success) {
      toast.add({ title: "No se pudo guardar", description: res.error.message, type: "error" });
      return false;
    }
    const advertencias = (res.value as { advertencias?: string[] }).advertencias ?? [];
    for (const advertencia of advertencias) {
      toast.add({ title: "Aviso", description: advertencia });
    }
    return true;
  }

  async function conOptimismo<T>(
    aplicar: (prev: TurnoVista[]) => TurnoVista[],
    ejecutar: () => Promise<ActionResult<T>>,
  ) {
    const snapshot = turnos;
    setTurnos(aplicar);
    const res = await ejecutar();
    if (!notificarResultado(res)) setTurnos(snapshot);
  }

  function handleMoverDia(turnoId: string, indiceDestino: number) {
    const turno = turnos.find((t) => t.id === turnoId);
    if (!turno) return;
    const { inicioIso, finIso } = moverADia(turno, lunes, indiceDestino);
    conOptimismo(
      (prev) => prev.map((t) => (t.id === turnoId ? { ...t, inicioIso, finIso } : t)),
      () =>
        moveTurnoAction({
          turnoId,
          inicio: toLocalDateTime(new Date(inicioIso)),
          fin: toLocalDateTime(new Date(finIso)),
        }),
    );
  }

  function handleEditarHoras(turnoId: string, horaInicio: string, horaFin: string) {
    const turno = turnos.find((t) => t.id === turnoId);
    if (!turno) return;
    const nuevoInicio = conHora(turno.inicioIso, horaInicio);
    const nuevoFin = conHora(turno.inicioIso, horaFin);
    if (nuevoFin.getTime() <= nuevoInicio.getTime()) {
      toast.add({
        title: "Horas inválidas",
        description: "La hora de fin debe ser posterior al inicio",
        type: "error",
      });
      return;
    }
    conOptimismo(
      (prev) =>
        prev.map((t) =>
          t.id === turnoId
            ? { ...t, inicioIso: nuevoInicio.toISOString(), finIso: nuevoFin.toISOString() }
            : t,
        ),
      () =>
        updateTurnoAction({
          turnoId,
          inicio: toLocalDateTime(nuevoInicio),
          fin: toLocalDateTime(nuevoFin),
        }),
    );
  }

  function handleReasignar(turnoId: string, usuarioId: string) {
    const turno = turnos.find((t) => t.id === turnoId);
    if (!turno) return;
    const empleado = empleados.find((e) => e.id === usuarioId);
    conOptimismo(
      (prev) =>
        prev.map((t) =>
          t.id === turnoId
            ? { ...t, usuarioId, usuarioNombre: empleado?.nombre ?? t.usuarioNombre }
            : t,
        ),
      () =>
        moveTurnoAction({
          turnoId,
          inicio: toLocalDateTime(new Date(turno.inicioIso)),
          fin: toLocalDateTime(new Date(turno.finIso)),
          usuarioId,
        }),
    );
  }

  function handleBorrar(turnoId: string) {
    conOptimismo(
      (prev) => prev.filter((t) => t.id !== turnoId),
      () => deleteTurnoAction({ turnoId }),
    );
  }

  function handleCrear(
    indice: number,
    usuarioId: string,
    horaInicio: string,
    horaFin: string,
  ) {
    const empleado = empleados.find((e) => e.id === usuarioId);
    const fecha = new Date(lunes);
    fecha.setDate(fecha.getDate() + indice);
    const inicio = conHora(fecha.toISOString(), horaInicio);
    const fin = conHora(fecha.toISOString(), horaFin);
    const tempId = `temp-${tempIdRef.current++}`;

    conOptimismo(
      (prev) => [
        ...prev,
        {
          id: tempId,
          usuarioId,
          usuarioNombre: empleado?.nombre ?? "",
          inicioIso: inicio.toISOString(),
          finIso: fin.toISOString(),
          origen: "manual",
        },
      ],
      () =>
        createTurnoAction({
          localId,
          usuarioId,
          inicio: toLocalDateTime(inicio),
          fin: toLocalDateTime(fin),
        }),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const indiceDestino = Number(String(over.id).replace("dia-", ""));
    const turno = turnos.find((t) => t.id === active.id);
    if (!turno) return;
    // Si se suelta en el mismo día, no hay cambio que persistir.
    if ((new Date(turno.inicioIso).getDay() + 6) % 7 === indiceDestino) return;
    handleMoverDia(String(active.id), indiceDestino);
  }

  const columnas = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      {DIAS.map((dia, indice) => {
        const fecha = new Date(lunes);
        fecha.setDate(fecha.getDate() + indice);
        const turnosDia = turnos
          .filter((t) => {
            const d = new Date(t.inicioIso);
            return (d.getDay() + 6) % 7 === indice;
          })
          .sort((a, b) => a.inicioIso.localeCompare(b.inicioIso));
        return (
          <DayColumn
            key={dia.value}
            indice={indice}
            label={dia.label}
            fecha={fecha}
            turnos={turnosDia}
            empleados={empleados}
            requeridas={requeridasPorDia[indice] ?? 0}
            readOnly={readOnly}
            onEditarHoras={handleEditarHoras}
            onReasignar={handleReasignar}
            onBorrar={handleBorrar}
            onCrear={handleCrear}
          />
        );
      })}
    </div>
  );

  if (readOnly && turnos.length === 0) {
    return (
      <EmptyState
        title="Sin turnos"
        description="No tienes turnos asignados esta semana."
      />
    );
  }

  // DndContext envuelve siempre (también en readOnly, con el drag deshabilitado
  // vía `disabled` en cada celda/tarjeta) para que los hooks de dnd-kit tengan
  // su contexto disponible.
  return (
    <DndContext sensors={readOnly ? [] : sensors} onDragEnd={handleDragEnd}>
      {columnas}
    </DndContext>
  );
}

export function HorarioSemanaBoard(props: BoardProps) {
  return (
    <ToastProvider>
      <BoardInner {...props} />
      <Toaster />
    </ToastProvider>
  );
}
