import { DIAS_SEMANA_OPCIONES } from "@/shared/kernel/dias-semana-labels";

/** Turno serializado que la página pasa al board (fechas como ISO string). */
export type TurnoVista = {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  inicioIso: string;
  finIso: string;
  origen: "manual" | "generado";
};

export type EmpleadoVista = { id: string; nombre: string };

/** Cobertura esperada por día (suma de personas requeridas en la plantilla). */
export type CoberturaPorDia = Record<string, number>;

export const DIAS = DIAS_SEMANA_OPCIONES;

/** Índice 0..6 (lunes..domingo) de una fecha local. */
export function indiceDiaSemana(fecha: Date): number {
  return (fecha.getDay() + 6) % 7;
}

/** "YYYY-MM-DDTHH:MM" en hora local, formato que espera `fechaLocalSchema`. */
export function toLocalDateTime(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}` +
    `T${p(fecha.getHours())}:${p(fecha.getMinutes())}`
  );
}

/** "HH:MM" local de un ISO string. */
export function horaDe(iso: string): string {
  const f = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(f.getHours())}:${p(f.getMinutes())}`;
}

export function duracionMinutos(inicioIso: string, finIso: string): number {
  return (new Date(finIso).getTime() - new Date(inicioIso).getTime()) / 60000;
}

/**
 * Reubica un turno en otro día del calendario manteniendo la hora del día y
 * la duración. `semanaInicio` es el lunes; `indiceDestino` es 0..6.
 */
export function moverADia(
  turno: TurnoVista,
  semanaInicio: Date,
  indiceDestino: number,
): { inicioIso: string; finIso: string } {
  const inicioActual = new Date(turno.inicioIso);
  const duracion = duracionMinutos(turno.inicioIso, turno.finIso);

  const nuevoInicio = new Date(semanaInicio);
  nuevoInicio.setDate(nuevoInicio.getDate() + indiceDestino);
  nuevoInicio.setHours(inicioActual.getHours(), inicioActual.getMinutes(), 0, 0);

  const nuevoFin = new Date(nuevoInicio.getTime() + duracion * 60000);
  return { inicioIso: nuevoInicio.toISOString(), finIso: nuevoFin.toISOString() };
}

/** Combina el día de un ISO con una hora "HH:MM" → nuevo Date local. */
export function conHora(baseIso: string, hhmm: string): Date {
  const base = new Date(baseIso);
  const [h, m] = hhmm.split(":").map(Number);
  const out = new Date(base);
  out.setHours(h, m, 0, 0);
  return out;
}

export function colorFranja(inicioIso: string): string {
  const hora = new Date(inicioIso).getHours();
  if (hora < 12) return "border-deep-sky-blue/30 bg-deep-sky-blue-soft text-deep-sky-blue";
  if (hora < 19) return "border-cool-horizon/30 bg-cool-horizon-soft text-cool-horizon";
  return "border-fuchsia-plum/30 bg-fuchsia-plum-soft text-fuchsia-plum";
}
