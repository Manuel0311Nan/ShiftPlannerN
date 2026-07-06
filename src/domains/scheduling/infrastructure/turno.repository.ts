import type { Prisma } from "@/generated/prisma/client";
import { TenantRepository } from "@/shared/kernel/tenant-repository";
import type {
  EmpleadoConDisponibilidad,
  TurnoDetallado,
  TurnoEnSemana,
  TurnoRepository,
} from "@/domains/scheduling/application/ports/turno-repository.port";
import type { DiaSemana } from "@/shared/kernel/dia-semana";

export class PrismaTurnoRepository
  extends TenantRepository
  implements TurnoRepository
{
  async buscarTurno(id: string): Promise<TurnoDetallado | null> {
    const turno = await this.db.turno.findUnique({
      where: { id },
      include: { usuario: { include: { local: true } } },
    });
    if (!turno) return null;
    return {
      id: turno.id,
      usuarioId: turno.usuarioId,
      inicio: turno.inicio,
      fin: turno.fin,
      metadata: (turno.metadata ?? {}) as Record<string, unknown>,
      localId: turno.usuario.localId,
      managerId: turno.usuario.local?.managerId ?? null,
    };
  }

  async buscarLocal(
    localId: string,
  ): Promise<{ id: string; managerId: string } | null> {
    return this.db.local.findUnique({
      where: { id: localId },
      select: { id: true, managerId: true },
    });
  }

  async empleadosDeLocal(localId: string): Promise<EmpleadoConDisponibilidad[]> {
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

  async turnosDeLocalEnSemana(
    localId: string,
    semanaInicio: Date,
  ): Promise<TurnoEnSemana[]> {
    const fin = new Date(semanaInicio);
    fin.setDate(fin.getDate() + 7);

    const empleados = await this.db.usuario.findMany({
      where: { localId },
      select: { id: true },
    });

    const turnos = await this.db.turno.findMany({
      where: {
        usuarioId: { in: empleados.map((empleado) => empleado.id) },
        inicio: { gte: semanaInicio, lt: fin },
      },
      select: { id: true, usuarioId: true, inicio: true, fin: true },
    });
    return turnos;
  }

  async crearTurno(input: {
    usuarioId: string;
    inicio: Date;
    fin: Date;
    metadata: Record<string, unknown>;
  }): Promise<{ id: string }> {
    const turno = await this.db.turno.create({
      data: {
        usuarioId: input.usuarioId,
        inicio: input.inicio,
        fin: input.fin,
        metadata: input.metadata as Prisma.InputJsonValue,
        empresaId: this.empresaId,
      },
      select: { id: true },
    });
    return turno;
  }

  async moverTurno(
    id: string,
    input: { inicio: Date; fin: Date; usuarioId: string },
  ): Promise<void> {
    await this.db.turno.update({
      where: { id },
      data: { inicio: input.inicio, fin: input.fin, usuarioId: input.usuarioId },
    });
  }

  async borrarTurno(id: string): Promise<void> {
    await this.db.turno.delete({ where: { id } });
  }
}
