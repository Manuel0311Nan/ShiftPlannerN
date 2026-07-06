import type { DisponibilidadEmpleado } from "@/domains/scheduling/domain/generar-asignaciones";

/** Turno con el contexto de local/manager necesario para autorizar. */
export type TurnoDetallado = {
  id: string;
  usuarioId: string;
  inicio: Date;
  fin: Date;
  metadata: Record<string, unknown>;
  /** Local del empleado dueño del turno (null si el empleado no tiene local). */
  localId: string | null;
  /** Manager del local del turno (null si no hay local). */
  managerId: string | null;
};

export type TurnoEnSemana = {
  id: string;
  usuarioId: string;
  inicio: Date;
  fin: Date;
};

export type EmpleadoConDisponibilidad = {
  id: string;
  disponibilidad: DisponibilidadEmpleado[];
};

export interface TurnoRepository {
  buscarTurno(id: string): Promise<TurnoDetallado | null>;
  buscarLocal(
    localId: string,
  ): Promise<{ id: string; managerId: string } | null>;
  /** Empleados del local con su disponibilidad, para validar reasignación/franja. */
  empleadosDeLocal(localId: string): Promise<EmpleadoConDisponibilidad[]>;
  /** Turnos del local en la semana [semanaInicio, +7 días), para detectar solapes. */
  turnosDeLocalEnSemana(
    localId: string,
    semanaInicio: Date,
  ): Promise<TurnoEnSemana[]>;
  crearTurno(input: {
    usuarioId: string;
    inicio: Date;
    fin: Date;
    metadata: Record<string, unknown>;
  }): Promise<{ id: string }>;
  moverTurno(
    id: string,
    input: { inicio: Date; fin: Date; usuarioId: string },
  ): Promise<void>;
  borrarTurno(id: string): Promise<void>;
}
