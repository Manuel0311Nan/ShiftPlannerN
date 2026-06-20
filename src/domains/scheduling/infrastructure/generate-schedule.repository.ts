import { TenantRepository } from "@/shared/kernel/tenant-repository";
import type {
  BloqueRequerido,
  Empleado,
} from "@/domains/scheduling/domain/generar-asignaciones";
import type { GenerateScheduleRepository } from "@/domains/scheduling/application/ports/generate-schedule-repository.port";
import type { DiaSemana } from "@/shared/kernel/dia-semana";

export class PrismaGenerateScheduleRepository
  extends TenantRepository
  implements GenerateScheduleRepository
{
  async buscarLocal(
    localId: string,
  ): Promise<{ id: string; managerId: string } | null> {
    return this.db.local.findUnique({
      where: { id: localId },
      select: { id: true, managerId: true },
    });
  }

  async bloquesDeLocal(localId: string): Promise<BloqueRequerido[]> {
    const bloques = await this.db.plantillaTurno.findMany({
      where: { localId },
    });
    return bloques.map((bloque) => ({
      id: bloque.id,
      nombre: bloque.nombre,
      diaSemana: bloque.diaSemana as DiaSemana,
      horaInicio: bloque.horaInicio,
      horaFin: bloque.horaFin,
      personasRequeridas: bloque.personasRequeridas,
    }));
  }

  async empleadosConDisponibilidad(localId: string): Promise<Empleado[]> {
    const empleados = await this.db.usuario.findMany({
      where: { localId, rol: "EMPLOYEE" },
      include: { disponibilidad: true },
    });
    return empleados.map((empleado) => ({
      id: empleado.id,
      disponibilidad: empleado.disponibilidad.map((bloque) => ({
        diaSemana: bloque.diaSemana as DiaSemana,
        horaInicio: bloque.horaInicio,
        horaFin: bloque.horaFin,
      })),
    }));
  }

  async borrarTurnosGenerados(localId: string, semanaInicio: Date): Promise<void> {
    const fin = new Date(semanaInicio);
    fin.setDate(fin.getDate() + 7);

    const empleados = await this.db.usuario.findMany({
      where: { localId },
      select: { id: true },
    });

    await this.db.turno.deleteMany({
      where: {
        usuarioId: { in: empleados.map((empleado) => empleado.id) },
        inicio: { gte: semanaInicio, lt: fin },
      },
    });
  }

  async crearTurnos(
    turnos: { usuarioId: string; inicio: Date; fin: Date }[],
  ): Promise<void> {
    if (turnos.length === 0) return;
    await this.db.turno.createMany({
      data: turnos.map((turno) => ({
        usuarioId: turno.usuarioId,
        inicio: turno.inicio,
        fin: turno.fin,
        metadata: { generado: true },
        empresaId: this.empresaId,
      })),
    });
  }
}
