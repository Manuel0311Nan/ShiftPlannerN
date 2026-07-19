import type {
  BloqueRequerido,
  Empleado,
} from "@/domains/scheduling/domain/generar-asignaciones";
import type { EmpleadoOptimizacion } from "@/domains/scheduling/domain/generar-asignaciones-ilp";

export type EmpleadoParaOptimizacion = EmpleadoOptimizacion & { nombre: string };

export interface GenerateScheduleRepository {
  buscarLocal(localId: string): Promise<{ id: string; managerId: string } | null>;
  bloquesDeLocal(localId: string): Promise<BloqueRequerido[]>;
  empleadosConDisponibilidad(localId: string): Promise<Empleado[]>;
  /**
   * Empleados con disponibilidad y condiciones, para el motor ILP. Si un
   * trabajador tiene un override de disponibilidad aprobado para `semanaInicio`,
   * se usa ese en lugar de su disponibilidad base.
   */
  empleadosParaOptimizacion(
    localId: string,
    semanaInicio: Date,
  ): Promise<EmpleadoParaOptimizacion[]>;
  borrarTurnosGenerados(localId: string, semanaInicio: Date): Promise<void>;
  crearTurnos(
    turnos: { usuarioId: string; inicio: Date; fin: Date }[],
  ): Promise<void>;
}
