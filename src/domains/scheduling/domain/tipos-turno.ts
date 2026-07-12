import type { DiaSemana } from "@/shared/kernel/dia-semana";
import { TIPOS_TURNO, type TipoTurno } from "@/shared/kernel/tipo-turno";

export type BloqueTiempo = {
  id: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
};

export type RolesDia = { aperturaId: string; cierreId: string };
export type ConteoTipos = Record<TipoTurno, number>;
export type Deficit = { tipo: TipoTurno; faltan: number };

function minutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Roles de cada día de la plantilla (deterministas, por hora):
 * apertura = bloque de inicio más temprano; cierre = bloque de fin más tardío.
 * Si un día tiene un único bloque, ese bloque es apertura y cierre a la vez.
 */
export function rolesPorDia(bloques: BloqueTiempo[]): Map<DiaSemana, RolesDia> {
  const porDia = new Map<DiaSemana, BloqueTiempo[]>();
  for (const bloque of bloques) {
    const lista = porDia.get(bloque.diaSemana) ?? [];
    lista.push(bloque);
    porDia.set(bloque.diaSemana, lista);
  }

  const roles = new Map<DiaSemana, RolesDia>();
  for (const [dia, lista] of porDia) {
    let apertura = lista[0];
    let cierre = lista[0];
    for (const bloque of lista) {
      if (minutos(bloque.horaInicio) < minutos(apertura.horaInicio)) apertura = bloque;
      if (minutos(bloque.horaFin) > minutos(cierre.horaFin)) cierre = bloque;
    }
    roles.set(dia, { aperturaId: apertura.id, cierreId: cierre.id });
  }
  return roles;
}

/**
 * Clasifica lo que hace un trabajador en un día concreto (no excluyente):
 * un partido que incluye el bloque de cierre cuenta partido y cierre.
 */
export function clasificarDia(
  bloquesDelDia: BloqueTiempo[],
  roles: RolesDia | undefined,
): { apertura: boolean; cierre: boolean; partido: boolean } {
  if (bloquesDelDia.length === 0 || !roles) {
    return { apertura: false, cierre: false, partido: false };
  }
  return {
    apertura: bloquesDelDia.some((b) => b.id === roles.aperturaId),
    cierre: bloquesDelDia.some((b) => b.id === roles.cierreId),
    partido: bloquesDelDia.length >= 2,
  };
}

/** Suma semanal de cada tipo a partir de los bloques asignados a un trabajador. */
export function contarTipos(
  bloquesAsignados: BloqueTiempo[],
  roles: Map<DiaSemana, RolesDia>,
): ConteoTipos {
  const porDia = new Map<DiaSemana, BloqueTiempo[]>();
  for (const bloque of bloquesAsignados) {
    const lista = porDia.get(bloque.diaSemana) ?? [];
    lista.push(bloque);
    porDia.set(bloque.diaSemana, lista);
  }

  const conteo: ConteoTipos = { APERTURA: 0, CIERRE: 0, PARTIDO: 0 };
  for (const [dia, lista] of porDia) {
    const c = clasificarDia(lista, roles.get(dia));
    if (c.apertura) conteo.APERTURA += 1;
    if (c.cierre) conteo.CIERRE += 1;
    if (c.partido) conteo.PARTIDO += 1;
  }
  return conteo;
}

/**
 * ¿La asignación de un trabajador cumple sus mínimos por tipo? Devuelve además
 * el déficit por tipo para poder explicar por qué no se cumple.
 */
export function cumpleCondiciones(
  bloquesAsignados: BloqueTiempo[],
  roles: Map<DiaSemana, RolesDia>,
  minimos: { tipo: TipoTurno; minimo: number }[],
): { cumple: boolean; deficit: Deficit[] } {
  const conteo = contarTipos(bloquesAsignados, roles);
  const deficit: Deficit[] = [];
  for (const tipo of TIPOS_TURNO) {
    const min = minimos.find((m) => m.tipo === tipo)?.minimo ?? 0;
    if (conteo[tipo] < min) deficit.push({ tipo, faltan: min - conteo[tipo] });
  }
  return { cumple: deficit.length === 0, deficit };
}
