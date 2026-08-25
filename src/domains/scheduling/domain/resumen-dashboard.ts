import { DIAS_SEMANA, type DiaSemana } from "@/shared/kernel/dia-semana";

/**
 * Agregaciones puras del panel de resumen. Todo lo que aquí se calcula sale de
 * datos que el dominio ya tiene (turnos + plantilla de local): ni asistencia
 * (no hay fichajes) ni coste laboral (no hay tarifa) se derivan aquí.
 */

export type TurnoDelPeriodo = {
  usuarioId: string;
  usuarioNombre: string;
  inicio: Date;
  fin: Date;
};

export type BloquePlantillaResumen = {
  localNombre: string;
  diaSemana: DiaSemana;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  personasRequeridas: number;
};

export type Franja = "MANANA" | "TARDE" | "NOCHE";

export type BarraDia = {
  dia: DiaSemana;
  horas: number;
  /** Altura relativa (0-100) respecto al día de más carga de la semana. */
  pct: number;
  esHoy: boolean;
};

export type BloqueHoy = {
  /** `${horaInicio}-${horaFin}`: identifica el bloque dentro del día. */
  clave: string;
  franja: Franja;
  horaInicio: string;
  horaFin: string;
  /** Nombre del bloque de plantilla que coincide en horario, si lo hay. */
  titulo: string | null;
  localNombre: string | null;
  asignados: string[];
  /** Personas que pide la plantilla; null si el turno no casa con ningún bloque. */
  requeridas: number | null;
};

/** Lunes = 0, para indexar DIAS_SEMANA (que empieza en LUNES). */
export function diaSemanaDe(fecha: Date): DiaSemana {
  return DIAS_SEMANA[(fecha.getDay() + 6) % 7];
}

/** "HH:MM" en hora local, el mismo formato que guarda PlantillaTurno. */
export function horaDe(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(fecha.getHours())}:${p(fecha.getMinutes())}`;
}

/** Mismos cortes que el saludo del panel: mañana < 12, tarde < 20, resto noche. */
export function franjaDe(horaInicio: string): Franja {
  const hora = Number(horaInicio.split(":")[0]);
  if (hora < 12) return "MANANA";
  if (hora < 20) return "TARDE";
  return "NOCHE";
}

function duracionEnHoras(turno: TurnoDelPeriodo): number {
  return (turno.fin.getTime() - turno.inicio.getTime()) / 3_600_000;
}

function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Suma de horas de todos los turnos del periodo, redondeada a 1 decimal. */
export function horasProgramadas(turnos: TurnoDelPeriodo[]): number {
  const total = turnos.reduce((acc, turno) => acc + duracionEnHoras(turno), 0);
  return Math.round(total * 10) / 10;
}

/**
 * Horas por día de la semana. El turno cuenta en el día de su `inicio`, así un
 * turno que cruza medianoche no se parte entre dos barras.
 */
export function horasPorDia(
  turnos: TurnoDelPeriodo[],
  hoy: Date,
): BarraDia[] {
  const horas = new Map<DiaSemana, number>();
  for (const turno of turnos) {
    const dia = diaSemanaDe(turno.inicio);
    horas.set(dia, (horas.get(dia) ?? 0) + duracionEnHoras(turno));
  }

  const maximo = Math.max(0, ...horas.values());
  const diaDeHoy = diaSemanaDe(hoy);

  return DIAS_SEMANA.map((dia) => {
    const total = horas.get(dia) ?? 0;
    return {
      dia,
      horas: Math.round(total * 10) / 10,
      pct: maximo === 0 ? 0 : Math.round((total / maximo) * 100),
      esHoy: dia === diaDeHoy,
    };
  });
}

/**
 * Turnos de hoy agrupados por horario. Se cruzan con la plantilla del día por
 * (horaInicio, horaFin) — es la única clave común, porque `Turno` no guarda a
 * qué bloque de plantilla pertenece — para poder mostrar nombre y cobertura.
 */
export function bloquesDeHoy(
  turnos: TurnoDelPeriodo[],
  plantilla: BloquePlantillaResumen[],
  hoy: Date,
): BloqueHoy[] {
  const diaDeHoy = diaSemanaDe(hoy);
  const plantillaHoy = plantilla.filter((b) => b.diaSemana === diaDeHoy);
  const bloquePorClave = new Map(
    plantillaHoy.map((b) => [`${b.horaInicio}-${b.horaFin}`, b]),
  );

  const agrupados = new Map<string, BloqueHoy>();

  // Primero la plantilla: un bloque sin nadie asignado debe verse (cobertura 0).
  for (const bloque of plantillaHoy) {
    const clave = `${bloque.horaInicio}-${bloque.horaFin}`;
    const existente = agrupados.get(clave);
    if (existente) {
      existente.requeridas = (existente.requeridas ?? 0) + bloque.personasRequeridas;
      continue;
    }
    agrupados.set(clave, {
      clave,
      franja: franjaDe(bloque.horaInicio),
      horaInicio: bloque.horaInicio,
      horaFin: bloque.horaFin,
      titulo: bloque.nombre,
      localNombre: bloque.localNombre,
      asignados: [],
      requeridas: bloque.personasRequeridas,
    });
  }

  // Luego los turnos reales, incluidos los manuales fuera de plantilla.
  for (const turno of turnos) {
    if (!mismoDia(turno.inicio, hoy)) continue;
    const horaInicio = horaDe(turno.inicio);
    const horaFin = horaDe(turno.fin);
    const clave = `${horaInicio}-${horaFin}`;

    const existente = agrupados.get(clave);
    if (existente) {
      existente.asignados.push(turno.usuarioNombre);
      continue;
    }
    const deLaPlantilla = bloquePorClave.get(clave);
    agrupados.set(clave, {
      clave,
      franja: franjaDe(horaInicio),
      horaInicio,
      horaFin,
      titulo: deLaPlantilla?.nombre ?? null,
      localNombre: deLaPlantilla?.localNombre ?? null,
      asignados: [turno.usuarioNombre],
      requeridas: deLaPlantilla?.personasRequeridas ?? null,
    });
  }

  return [...agrupados.values()].sort((a, b) =>
    a.horaInicio.localeCompare(b.horaInicio),
  );
}

/**
 * Plazas de la plantilla que la semana no llega a cubrir: por cada bloque,
 * `personasRequeridas` menos los turnos que casan con su día y horario. Los
 * excedentes no restan (un día sobrecubierto no tapa otro descubierto).
 */
export function turnosAbiertos(
  turnos: TurnoDelPeriodo[],
  plantilla: BloquePlantillaResumen[],
): number {
  const asignadosPorClave = new Map<string, number>();
  for (const turno of turnos) {
    const clave = `${diaSemanaDe(turno.inicio)}-${horaDe(turno.inicio)}-${horaDe(turno.fin)}`;
    asignadosPorClave.set(clave, (asignadosPorClave.get(clave) ?? 0) + 1);
  }

  const requeridasPorClave = new Map<string, number>();
  for (const bloque of plantilla) {
    const clave = `${bloque.diaSemana}-${bloque.horaInicio}-${bloque.horaFin}`;
    requeridasPorClave.set(
      clave,
      (requeridasPorClave.get(clave) ?? 0) + bloque.personasRequeridas,
    );
  }

  let abiertos = 0;
  for (const [clave, requeridas] of requeridasPorClave) {
    abiertos += Math.max(0, requeridas - (asignadosPorClave.get(clave) ?? 0));
  }
  return abiertos;
}
