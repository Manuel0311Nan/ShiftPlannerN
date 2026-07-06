import { DIAS_SEMANA, type DiaSemana } from "@/shared/kernel/dia-semana";
import type { DisponibilidadEmpleado } from "@/domains/scheduling/domain/generar-asignaciones";

export type Intervalo = { inicio: Date; fin: Date };

/**
 * Dos intervalos temporales se solapan si cada uno empieza antes de que el
 * otro termine. Intervalos que solo se tocan en el extremo (fin === inicio)
 * no cuentan como solape: un turno puede empezar justo cuando otro acaba.
 */
export function intervalosSolapan(a: Intervalo, b: Intervalo): boolean {
  return a.inicio.getTime() < b.fin.getTime() && b.inicio.getTime() < a.fin.getTime();
}

/** Día de la semana (LUNES…DOMINGO) de una fecha en hora local. */
export function diaSemanaDe(fecha: Date): DiaSemana {
  // getDay(): 0 = domingo … 6 = sábado; DIAS_SEMANA empieza en lunes.
  const offset = (fecha.getDay() + 6) % 7;
  return DIAS_SEMANA[offset];
}

/** Hora "HH:MM" (local, 24h) de una fecha. */
export function horaHHMM(fecha: Date): string {
  const h = String(fecha.getHours()).padStart(2, "0");
  const m = String(fecha.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function minutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/**
 * ¿La disponibilidad declarada por un empleado cubre por completo la franja
 * de un turno? Mismo día y la disponibilidad envuelve inicio/fin del turno.
 */
export function disponibilidadCubre(
  disponibilidad: DisponibilidadEmpleado[],
  intervalo: Intervalo,
): boolean {
  const dia = diaSemanaDe(intervalo.inicio);
  const inicio = minutos(horaHHMM(intervalo.inicio));
  const fin = minutos(horaHHMM(intervalo.fin));
  return disponibilidad.some(
    (d) =>
      d.diaSemana === dia &&
      minutos(d.horaInicio) <= inicio &&
      minutos(d.horaFin) >= fin,
  );
}
