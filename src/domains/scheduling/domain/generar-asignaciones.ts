import { DIAS_SEMANA, type DiaSemana } from "@/shared/kernel/dia-semana";
import { minutos, unionCubre } from "@/shared/kernel/intervalos";

export { minutos };

export type BloqueRequerido = {
  id: string;
  nombre: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  personasRequeridas: number;
};

export type DisponibilidadEmpleado = {
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
};

export type Empleado = {
  id: string;
  disponibilidad: DisponibilidadEmpleado[];
};

export type Asignacion = { bloqueId: string; usuarioId: string };
export type Hueco = { bloqueId: string; faltan: number };

export function duracionHoras(bloque: { horaInicio: string; horaFin: string }): number {
  return (minutos(bloque.horaFin) - minutos(bloque.horaInicio)) / 60;
}

/**
 * ¿La disponibilidad declarada por un empleado cubre el bloque entero? Se
 * evalúa sobre la **unión** de sus franjas de ese día, no franja a franja: con
 * disponibilidad de 09:00-14:00 y 14:00-22:00 puede cubrir un turno de
 * 12:00-18:00, aunque ninguna de las dos lo envuelva por separado.
 */
export function cubreDisponibilidad(
  disponibilidad: DisponibilidadEmpleado[],
  bloque: { diaSemana: DiaSemana; horaInicio: string; horaFin: string },
): boolean {
  return unionCubre(
    disponibilidad.filter((d) => d.diaSemana === bloque.diaSemana),
    bloque,
  );
}

export function seSuperponen(
  a: { diaSemana: DiaSemana; horaInicio: string; horaFin: string },
  b: { diaSemana: DiaSemana; horaInicio: string; horaFin: string },
): boolean {
  if (a.diaSemana !== b.diaSemana) return false;
  return minutos(a.horaInicio) < minutos(b.horaFin) && minutos(b.horaInicio) < minutos(a.horaFin);
}

/**
 * Heurística greedy: por cada bloque (en orden), asigna a los empleados
 * disponibles con menos horas ya asignadas esta semana, sin solapar turnos
 * del mismo día. Sin backtracking — si un bloque queda corto de gente, se
 * reporta como hueco en vez de abortar toda la generación.
 */
export function generarAsignaciones(
  bloques: BloqueRequerido[],
  empleados: Empleado[],
): { asignaciones: Asignacion[]; huecos: Hueco[] } {
  const bloquesOrdenados = [...bloques].sort(
    (a, b) =>
      a.diaSemana.localeCompare(b.diaSemana) ||
      minutos(a.horaInicio) - minutos(b.horaInicio),
  );

  const horasAsignadas = new Map<string, number>();
  const turnosPorEmpleado = new Map<
    string,
    { diaSemana: DiaSemana; horaInicio: string; horaFin: string }[]
  >();
  for (const empleado of empleados) {
    horasAsignadas.set(empleado.id, 0);
    turnosPorEmpleado.set(empleado.id, []);
  }

  const asignaciones: Asignacion[] = [];
  const huecos: Hueco[] = [];

  for (const bloque of bloquesOrdenados) {
    const candidatos = empleados
      .filter((empleado) => cubreDisponibilidad(empleado.disponibilidad, bloque))
      .filter((empleado) => {
        const turnos = turnosPorEmpleado.get(empleado.id) ?? [];
        return !turnos.some((turno) => seSuperponen(turno, bloque));
      })
      .sort(
        (a, b) => (horasAsignadas.get(a.id) ?? 0) - (horasAsignadas.get(b.id) ?? 0),
      );

    const elegidos = candidatos.slice(0, bloque.personasRequeridas);
    for (const empleado of elegidos) {
      asignaciones.push({ bloqueId: bloque.id, usuarioId: empleado.id });
      horasAsignadas.set(
        empleado.id,
        (horasAsignadas.get(empleado.id) ?? 0) + duracionHoras(bloque),
      );
      turnosPorEmpleado.get(empleado.id)?.push(bloque);
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

/** Convierte un bloque (día de la semana + horas) en fechas reales para una semana concreta. */
export function calcularFechasBloque(
  semanaInicio: Date,
  bloque: { diaSemana: DiaSemana; horaInicio: string; horaFin: string },
): { inicio: Date; fin: Date } {
  const offset = DIAS_SEMANA.indexOf(bloque.diaSemana);
  const fecha = new Date(semanaInicio);
  fecha.setDate(fecha.getDate() + offset);

  const [horaInicioH, horaInicioM] = bloque.horaInicio.split(":").map(Number);
  const [horaFinH, horaFinM] = bloque.horaFin.split(":").map(Number);

  const inicio = new Date(fecha);
  inicio.setHours(horaInicioH, horaInicioM, 0, 0);
  const fin = new Date(fecha);
  fin.setHours(horaFinH, horaFinM, 0, 0);

  return { inicio, fin };
}
