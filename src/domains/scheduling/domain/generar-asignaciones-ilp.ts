import type { DiaSemana } from "@/shared/kernel/dia-semana";
import type { TipoTurno } from "@/shared/kernel/tipo-turno";
import {
  cubre,
  duracionHoras,
  seSuperponen,
  type BloqueRequerido,
  type DisponibilidadEmpleado,
} from "@/domains/scheduling/domain/generar-asignaciones";
import { rolesPorDia, type RolesDia } from "@/domains/scheduling/domain/tipos-turno";
import { MAX_HORAS_SEMANALES } from "@/domains/employees/domain/horas-contrato";
import { DIAS_POR_SEMANA } from "@/domains/employees/domain/dias-libres";
import type {
  ModeloILP,
  Restriccion,
  SolucionILP,
} from "@/domains/scheduling/domain/modelo-ilp";

export type EmpleadoOptimizacion = {
  id: string;
  disponibilidad: DisponibilidadEmpleado[];
  condiciones: { tipo: TipoTurno; minimo: number }[];
  /** Horas semanales contratadas: mínimo a cumplir y tope salvo horas extra. */
  horasContrato: number;
  /** Días de libranza obligatorios por semana (tope duro de días trabajados). */
  diasLibres: number;
};

type MetaAsignacion = { variable: string; usuarioId: string; bloqueId: string };
type MetaSlack = { variable: string; usuarioId: string; tipo: TipoTurno };
type MetaHorasSlack = { variable: string; usuarioId: string };

export type MetaModelo = {
  asignaciones: MetaAsignacion[];
  bloques: { id: string; personasRequeridas: number }[];
  slacks: MetaSlack[];
  horasSlacks: MetaHorasSlack[];
};

const OBJ = "obj";
const HVAR = "H";
const PESO_COBERTURA = 1000;
const PESO_DEFICIT = 1_000_000;
const PESO_DEFICIT_HORAS = 1_000_000;

const xVar = (usuarioId: string, bloqueId: string) => `x__${usuarioId}__${bloqueId}`;
const pVar = (usuarioId: string, dia: DiaSemana) => `p__${usuarioId}__${dia}`;
const covCon = (bloqueId: string) => `cov__${bloqueId}`;
const minCon = (usuarioId: string, tipo: TipoTurno) => `min__${usuarioId}__${tipo}`;
const capCon = (usuarioId: string) => `cap__${usuarioId}`;
const hminCon = (usuarioId: string) => `hmin__${usuarioId}`;
const dVar = (usuarioId: string, dia: DiaSemana) => `d__${usuarioId}__${dia}`;
const diasCon = (usuarioId: string) => `dias__${usuarioId}`;

/** Tope de horas semanales del trabajador: contrato, o el máximo legal con extra. */
function topeHoras(horasContrato: number, permitirHorasExtra: boolean): number {
  return permitirHorasExtra
    ? MAX_HORAS_SEMANALES
    : Math.min(horasContrato, MAX_HORAS_SEMANALES);
}

function agruparPorDia(bloques: BloqueRequerido[]): Map<DiaSemana, BloqueRequerido[]> {
  const porDia = new Map<DiaSemana, BloqueRequerido[]>();
  for (const b of bloques) {
    const lista = porDia.get(b.diaSemana) ?? [];
    lista.push(b);
    porDia.set(b.diaSemana, lista);
  }
  return porDia;
}

/** Nombres de variable que suman para el mínimo de un tipo (según los roles). */
function terminosMinimo(
  usuarioId: string,
  tipo: TipoTurno,
  roles: Map<DiaSemana, RolesDia>,
): string[] {
  if (tipo === "PARTIDO") {
    return [...roles.keys()].map((dia) => pVar(usuarioId, dia));
  }
  return [...roles.values()].map((r) =>
    xVar(usuarioId, tipo === "APERTURA" ? r.aperturaId : r.cierreId),
  );
}

function construir(
  bloques: BloqueRequerido[],
  empleados: EmpleadoOptimizacion[],
  elastico: boolean,
  permitirHorasExtra: boolean,
): { modelo: ModeloILP; meta: MetaModelo } {
  const variables: Record<string, Record<string, number>> = {};
  const restricciones: Record<string, Restriccion> = {};
  const binarias: string[] = [];
  const enteras: string[] = [];
  const asignaciones: MetaAsignacion[] = [];
  const slacks: MetaSlack[] = [];
  const horasSlacks: MetaHorasSlack[] = [];

  const roles = rolesPorDia(bloques);
  const disponibles = new Map<string, BloqueRequerido[]>();

  // Variables x__w__b (binarias) solo para pares disponibles; recompensan cobertura.
  for (const e of empleados) {
    const bs = bloques.filter((b) => e.disponibilidad.some((d) => cubre(d, b)));
    disponibles.set(e.id, bs);
    for (const b of bs) {
      const nombre = xVar(e.id, b.id);
      variables[nombre] = { [OBJ]: PESO_COBERTURA };
      binarias.push(nombre);
      asignaciones.push({ variable: nombre, usuarioId: e.id, bloqueId: b.id });
    }
  }

  // Cobertura (dura como tope): Σ_w x ≤ personasRequeridas.
  for (const b of bloques) {
    const cn = covCon(b.id);
    restricciones[cn] = { max: b.personasRequeridas };
    for (const e of empleados) {
      const v = variables[xVar(e.id, b.id)];
      if (v) v[cn] = 1;
    }
  }

  // No-solape por trabajador: pares de bloques solapados del mismo día.
  for (const e of empleados) {
    const bs = disponibles.get(e.id) ?? [];
    for (let i = 0; i < bs.length; i++) {
      for (let j = i + 1; j < bs.length; j++) {
        if (seSuperponen(bs[i], bs[j])) {
          const cn = `ov__${e.id}__${bs[i].id}__${bs[j].id}`;
          restricciones[cn] = { max: 1 };
          variables[xVar(e.id, bs[i].id)][cn] = 1;
          variables[xVar(e.id, bs[j].id)][cn] = 1;
        }
      }
    }
  }

  // Partido: aux p__w__d con 2·p − Σ_{b∈d} x ≤ 0.
  for (const e of empleados) {
    for (const [dia, bs] of agruparPorDia(disponibles.get(e.id) ?? [])) {
      if (bs.length < 2) continue;
      const p = pVar(e.id, dia);
      variables[p] = {};
      binarias.push(p);
      const cn = `plink__${e.id}__${dia}`;
      restricciones[cn] = { max: 0 };
      variables[p][cn] = 2;
      for (const b of bs) variables[xVar(e.id, b.id)][cn] = -1;
    }
  }

  // Mínimos por tipo (duros; o blandos con slack penalizado si elástico).
  for (const e of empleados) {
    for (const cond of e.condiciones) {
      if (cond.minimo <= 0) continue;
      const cn = minCon(e.id, cond.tipo);
      restricciones[cn] = { min: cond.minimo };
      for (const vn of terminosMinimo(e.id, cond.tipo, roles)) {
        if (variables[vn]) variables[vn][cn] = (variables[vn][cn] ?? 0) + 1;
      }
      if (elastico) {
        const s = `slack__${e.id}__${cond.tipo}`;
        variables[s] = { [OBJ]: -PESO_DEFICIT, [cn]: 1 };
        enteras.push(s);
        slacks.push({ variable: s, usuarioId: e.id, tipo: cond.tipo });
      }
    }
  }

  // Horas por trabajador: tope duro (Σ dur·x ≤ tope) y mínimo de contrato
  // (Σ dur·x ≥ horasContrato). El mínimo es duro en el modelo normal y blando
  // (con slack penalizado) en el elástico, para reportar horas sin cubrir en
  // vez de abortar cuando no hay demanda/disponibilidad suficiente.
  for (const e of empleados) {
    const bs = disponibles.get(e.id) ?? [];
    const cap = topeHoras(e.horasContrato, permitirHorasExtra);
    const cn = capCon(e.id);
    restricciones[cn] = { max: cap };
    for (const b of bs) {
      const v = variables[xVar(e.id, b.id)];
      v[cn] = (v[cn] ?? 0) + duracionHoras(b);
    }

    const hn = hminCon(e.id);
    restricciones[hn] = { min: e.horasContrato };
    for (const b of bs) {
      const v = variables[xVar(e.id, b.id)];
      v[hn] = (v[hn] ?? 0) + duracionHoras(b);
    }
    if (elastico) {
      const s = `hslack__${e.id}`;
      variables[s] = { [OBJ]: -PESO_DEFICIT_HORAS, [hn]: 1 };
      horasSlacks.push({ variable: s, usuarioId: e.id });
    }
  }

  // Días de libranza obligatorios (duro): tope de días trabajados a la semana.
  // Por cada día con bloques disponibles, un aux binario d__w__día que se activa
  // si el trabajador cubre algún bloque ese día (Σ_b x − n·d ≤ 0); luego se
  // limita Σ_día d ≤ DIAS_POR_SEMANA − diasLibres. Es un tope: trabajar menos
  // días siempre es factible, así que nunca provoca infactibilidad por sí solo
  // (si choca con el mínimo de horas, el elástico reporta el déficit de horas).
  for (const e of empleados) {
    if (e.diasLibres <= 0) continue;
    const porDia = agruparPorDia(disponibles.get(e.id) ?? []);
    const dn = diasCon(e.id);
    restricciones[dn] = { max: DIAS_POR_SEMANA - e.diasLibres };
    for (const [dia, bs] of porDia) {
      const d = dVar(e.id, dia);
      variables[d] = { [dn]: 1 };
      binarias.push(d);
      const cn = `dlink__${e.id}__${dia}`;
      restricciones[cn] = { max: 0 };
      variables[d][cn] = -bs.length;
      for (const b of bs) variables[xVar(e.id, b.id)][cn] = 1;
    }
  }

  // Equidad (objetivo secundario): minimizar la carga máxima H (horas_w ≤ H).
  variables[HVAR] = { [OBJ]: -1 };
  for (const e of empleados) {
    const cn = `load__${e.id}`;
    restricciones[cn] = { max: 0 };
    variables[HVAR][cn] = -1;
    for (const b of disponibles.get(e.id) ?? []) {
      const v = variables[xVar(e.id, b.id)];
      v[cn] = (v[cn] ?? 0) + duracionHoras(b);
    }
  }

  return {
    modelo: {
      objetivo: "maximizar",
      nombreObjetivo: OBJ,
      restricciones,
      variables,
      binarias,
      enteras,
    },
    meta: {
      asignaciones,
      bloques: bloques.map((b) => ({
        id: b.id,
        personasRequeridas: b.personasRequeridas,
      })),
      slacks,
      horasSlacks,
    },
  };
}

export function construirModelo(input: {
  bloques: BloqueRequerido[];
  empleados: EmpleadoOptimizacion[];
  permitirHorasExtra?: boolean;
}): { modelo: ModeloILP; meta: MetaModelo } {
  return construir(
    input.bloques,
    input.empleados,
    false,
    input.permitirHorasExtra ?? false,
  );
}

export function construirModeloElastico(input: {
  bloques: BloqueRequerido[];
  empleados: EmpleadoOptimizacion[];
  permitirHorasExtra?: boolean;
}): { modelo: ModeloILP; meta: MetaModelo } {
  return construir(
    input.bloques,
    input.empleados,
    true,
    input.permitirHorasExtra ?? false,
  );
}

export function interpretarSolucion(
  solucion: SolucionILP,
  meta: MetaModelo,
): {
  asignaciones: { usuarioId: string; bloqueId: string }[];
  huecos: { bloqueId: string; faltan: number }[];
  deficits: { usuarioId: string; tipo: TipoTurno; faltan: number }[];
  horasDeficits: { usuarioId: string; faltan: number }[];
} {
  const asignaciones = meta.asignaciones
    .filter((a) => (solucion.variables.get(a.variable) ?? 0) >= 0.5)
    .map((a) => ({ usuarioId: a.usuarioId, bloqueId: a.bloqueId }));

  const asignadosPorBloque = new Map<string, number>();
  for (const a of asignaciones) {
    asignadosPorBloque.set(a.bloqueId, (asignadosPorBloque.get(a.bloqueId) ?? 0) + 1);
  }

  const huecos = meta.bloques
    .map((b) => ({
      bloqueId: b.id,
      faltan: b.personasRequeridas - (asignadosPorBloque.get(b.id) ?? 0),
    }))
    .filter((h) => h.faltan > 0);

  const deficits = meta.slacks
    .map((s) => ({
      usuarioId: s.usuarioId,
      tipo: s.tipo,
      faltan: Math.round(solucion.variables.get(s.variable) ?? 0),
    }))
    .filter((d) => d.faltan > 0);

  const horasDeficits = meta.horasSlacks
    .map((s) => ({
      usuarioId: s.usuarioId,
      // Redondeo a media hora: el slack es continuo y el solver puede dejar
      // restos de coma flotante ínfimos que no deben aparecer como déficit.
      faltan: Math.round((solucion.variables.get(s.variable) ?? 0) * 2) / 2,
    }))
    .filter((d) => d.faltan > 0);

  return { asignaciones, huecos, deficits, horasDeficits };
}
