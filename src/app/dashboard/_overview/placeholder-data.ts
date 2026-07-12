/**
 * Datos PLACEHOLDER del dashboard de resumen.
 *
 * TODO(scheduling): sustituir por un `GetDashboardOverviewQuery` que agregue
 * datos reales del dominio. Hoy el dominio no expone asistencia/check-in ni
 * coste laboral, así que estos valores son ficticios y solo alimentan la UI
 * reconstruida desde el diseño de Stitch ("ShiftPlanner Design System").
 */

export type Franja = "morning" | "afternoon" | "night";

export type TurnoResumen = {
  franja: Franja;
  franjaLabel: string;
  horario: string;
  unidad: string;
  meta: string;
  dotados: string[];
  extra: number;
};

export type BarraSemana = {
  dia: string;
  pct: number;
  activo?: boolean;
};

export type MetricaResumen = {
  label: string;
  valor: string;
  tono?: "default" | "warning";
};

export const asistenciaPlaceholder = {
  porcentaje: 94,
  delta: "+2,4%",
  presentes: 42,
  total: 45,
  aTiempo: 38,
  aTiempoPct: 84,
};

export const horasSemanaPlaceholder: BarraSemana[] = [
  { dia: "LUN", pct: 60 },
  { dia: "MAR", pct: 85 },
  { dia: "MIÉ", pct: 70 },
  { dia: "JUE", pct: 95, activo: true },
  { dia: "VIE", pct: 40 },
  { dia: "SÁB", pct: 25 },
  { dia: "DOM", pct: 15 },
];

export const turnosHoyPlaceholder: TurnoResumen[] = [
  {
    franja: "morning",
    franjaLabel: "MAÑANA",
    horario: "06:00 - 14:00",
    unidad: "Urgencias · Planta A",
    meta: "5 DUE · 2 TCAE · Activo",
    dotados: ["María", "Jorge", "Sara"],
    extra: 4,
  },
  {
    franja: "afternoon",
    franjaLabel: "TARDE",
    horario: "14:00 - 22:00",
    unidad: "Unidad Especial · Norte",
    meta: "3 DUE · 1 Admin · Próximo",
    dotados: ["Lucía", "Andrés"],
    extra: 2,
  },
  {
    franja: "night",
    franjaLabel: "NOCHE",
    horario: "22:00 - 06:00",
    unidad: "Soporte nocturno",
    meta: "2 DUE · Programado",
    dotados: ["Kenji"],
    extra: 1,
  },
];

export const metricasPlaceholder: MetricaResumen[] = [
  { label: "PERSONAL TOTAL", valor: "128" },
  { label: "TURNOS ABIERTOS", valor: "12", tono: "warning" },
  { label: "HORAS REGISTRADAS", valor: "1.240" },
  { label: "COSTE LABORAL", valor: "42,1k €" },
];
