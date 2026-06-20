import type {
  BloqueRequerido,
  Empleado,
} from "@/domains/scheduling/domain/generar-asignaciones";

export interface GenerateScheduleRepository {
  buscarLocal(localId: string): Promise<{ id: string; managerId: string } | null>;
  bloquesDeLocal(localId: string): Promise<BloqueRequerido[]>;
  empleadosConDisponibilidad(localId: string): Promise<Empleado[]>;
  borrarTurnosGenerados(localId: string, semanaInicio: Date): Promise<void>;
  crearTurnos(
    turnos: { usuarioId: string; inicio: Date; fin: Date }[],
  ): Promise<void>;
}
