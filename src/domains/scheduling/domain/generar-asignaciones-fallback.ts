import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { MAX_HORAS_SEMANALES } from "@/domains/employees/domain/horas-contrato";
import { DIAS_POR_SEMANA } from "@/domains/employees/domain/dias-libres";
import {
  cubre,
  duracionHoras,
  minutos,
  seSuperponen,
  type BloqueRequerido,
} from "@/domains/scheduling/domain/generar-asignaciones";
import type { EmpleadoOptimizacion } from "@/domains/scheduling/domain/generar-asignaciones-ilp";

/**
 * Heurístico greedy de **respaldo**: se usa cuando el ILP exacto no resuelve
 * dentro del presupuesto de tiempo (modelo demasiado grande/restringido). No
 * busca el óptimo, pero es lineal y siempre devuelve un horario respetando las
 * restricciones DURAS: disponibilidad, no-solape, tope de horas y días de
 * libranza. Las condiciones "blandas" (mínimos por tipo) no se fuerzan; lo que
 * no se cubre se reporta como hueco, igual que en el modo exacto.
 *
 * Estrategia por bloque (ordenados por día/hora): elegir entre los disponibles
 * a los que menos horas llevan asignadas esa semana, sin pasarse del tope de
 * horas ni abrir un día nuevo si ya agotaron sus días trabajables.
 */
export function generarAsignacionesFallback(
  bloques: BloqueRequerido[],
  empleados: EmpleadoOptimizacion[],
  opciones: { permitirHorasExtra: boolean },
): {
  asignaciones: { usuarioId: string; bloqueId: string }[];
  huecos: { bloqueId: string; faltan: number }[];
} {
  const topeHoras = (e: EmpleadoOptimizacion): number =>
    opciones.permitirHorasExtra
      ? MAX_HORAS_SEMANALES
      : Math.min(e.horasContrato, MAX_HORAS_SEMANALES);

  const maxDias = (e: EmpleadoOptimizacion): number =>
    e.diasLibres > 0 ? DIAS_POR_SEMANA - e.diasLibres : DIAS_POR_SEMANA;

  const bloquesOrdenados = [...bloques].sort(
    (a, b) =>
      a.diaSemana.localeCompare(b.diaSemana) ||
      minutos(a.horaInicio) - minutos(b.horaInicio),
  );

  const horas = new Map<string, number>();
  const diasTrabajados = new Map<string, Set<DiaSemana>>();
  const turnos = new Map<
    string,
    { diaSemana: DiaSemana; horaInicio: string; horaFin: string }[]
  >();
  for (const e of empleados) {
    horas.set(e.id, 0);
    diasTrabajados.set(e.id, new Set());
    turnos.set(e.id, []);
  }

  const asignaciones: { usuarioId: string; bloqueId: string }[] = [];
  const huecos: { bloqueId: string; faltan: number }[] = [];

  for (const bloque of bloquesOrdenados) {
    const dur = duracionHoras(bloque);
    const candidatos = empleados
      .filter((e) => e.disponibilidad.some((d) => cubre(d, bloque)))
      .filter((e) => !turnos.get(e.id)!.some((t) => seSuperponen(t, bloque)))
      .filter((e) => (horas.get(e.id) ?? 0) + dur <= topeHoras(e))
      .filter((e) => {
        const dias = diasTrabajados.get(e.id)!;
        // Puede si ya trabaja ese día, o si aún le quedan días libres por gastar.
        return dias.has(bloque.diaSemana) || dias.size < maxDias(e);
      })
      .sort((a, b) => (horas.get(a.id) ?? 0) - (horas.get(b.id) ?? 0));

    const elegidos = candidatos.slice(0, bloque.personasRequeridas);
    for (const e of elegidos) {
      asignaciones.push({ usuarioId: e.id, bloqueId: bloque.id });
      horas.set(e.id, (horas.get(e.id) ?? 0) + dur);
      diasTrabajados.get(e.id)!.add(bloque.diaSemana);
      turnos.get(e.id)!.push(bloque);
    }

    if (elegidos.length < bloque.personasRequeridas) {
      huecos.push({
        bloqueId: bloque.id,
        faltan: bloque.personasRequeridas - elegidos.length,
      });
    }
  }

  return { asignaciones, huecos };
}
