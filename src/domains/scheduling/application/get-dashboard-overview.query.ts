import { inicioSemana } from "@/domains/scheduling/domain/semana";
import {
  bloquesDeHoy,
  horasPorDia,
  horasProgramadas,
  turnosAbiertos,
  type BarraDia,
  type BloqueHoy,
} from "@/domains/scheduling/domain/resumen-dashboard";
import type {
  AlcanceResumen,
  DashboardOverviewRepository,
} from "@/domains/scheduling/application/ports/dashboard-overview-repository.port";

export type MetricasResumen = {
  personalTotal: number;
  turnosAbiertos: number;
  horasProgramadas: number;
  solicitudesPendientes: number;
};

export type DashboardOverview = {
  /** Lunes de la semana agregada, para etiquetar el periodo en la UI. */
  semanaInicio: Date;
  barrasSemana: BarraDia[];
  bloquesHoy: BloqueHoy[];
  metricas: MetricasResumen;
};

/**
 * Agrega en una sola pasada todo lo que el panel de resumen puede mostrar con
 * datos reales: horas por día, turnos de hoy con su cobertura, y las métricas
 * de cabecera. Deliberadamente NO cubre asistencia ni coste laboral: el modelo
 * no tiene fichajes ni tarifa horaria, y aproximarlos sería inventar.
 */
export class GetDashboardOverviewQuery {
  constructor(private readonly repo: DashboardOverviewRepository) {}

  async execute(
    alcance: AlcanceResumen,
    ahora: Date = new Date(),
  ): Promise<DashboardOverview> {
    const semanaInicio = inicioSemana(ahora);
    const semanaFin = new Date(semanaInicio);
    semanaFin.setDate(semanaFin.getDate() + 7);

    const [turnos, plantilla, personalTotal, solicitudesPendientes] =
      await Promise.all([
        this.repo.turnosEnRango(alcance, semanaInicio, semanaFin),
        this.repo.plantilla(alcance),
        this.repo.contarPersonal(alcance),
        this.repo.contarSolicitudesPendientes(alcance),
      ]);

    return {
      semanaInicio,
      barrasSemana: horasPorDia(turnos, ahora),
      bloquesHoy: bloquesDeHoy(turnos, plantilla, ahora),
      metricas: {
        personalTotal,
        turnosAbiertos: turnosAbiertos(turnos, plantilla),
        horasProgramadas: horasProgramadas(turnos),
        solicitudesPendientes,
      },
    };
  }
}
