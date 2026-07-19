import { TenantRepository } from "@/shared/kernel/tenant-repository";
import type { BloqueDisponibilidad } from "@/domains/employees/domain/bloque-disponibilidad";
import type {
  SolicitudDisponibilidadRepository,
  SolicitudEstado,
  SolicitudParaResolver,
} from "@/domains/employees/application/ports/solicitud-disponibilidad-repository.port";
import type { DiaSemana } from "@/generated/prisma/enums";

export class PrismaSolicitudDisponibilidadRepository
  extends TenantRepository
  implements SolicitudDisponibilidadRepository
{
  async crear(input: {
    usuarioId: string;
    semanaInicio: Date;
    motivo: string;
  }): Promise<void> {
    await this.db.solicitudDisponibilidad.create({
      data: {
        empresaId: this.empresaId,
        usuarioId: input.usuarioId,
        semanaInicio: input.semanaInicio,
        motivo: input.motivo,
      },
    });
  }

  async obtenerParaResolver(id: string): Promise<SolicitudParaResolver | null> {
    const fila = await this.db.solicitudDisponibilidad.findFirst({
      where: { id },
      select: {
        id: true,
        usuarioId: true,
        semanaInicio: true,
        estado: true,
        usuario: { select: { managerId: true } },
      },
    });
    if (!fila) return null;
    return {
      id: fila.id,
      usuarioId: fila.usuarioId,
      managerId: fila.usuario.managerId,
      semanaInicio: fila.semanaInicio,
      estado: fila.estado as SolicitudEstado,
    };
  }

  async resolver(input: {
    solicitudId: string;
    usuarioId: string;
    semanaInicio: Date;
    estado: "ACEPTADA" | "RECHAZADA";
    respuesta: string | null;
    resueltaPorId: string;
    disponibilidadSemana: BloqueDisponibilidad[] | null;
  }): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.solicitudDisponibilidad.update({
        where: { id: input.solicitudId },
        data: {
          estado: input.estado,
          respuesta: input.respuesta,
          resueltaPorId: input.resueltaPorId,
          resueltaAt: new Date(),
        },
      });

      if (input.estado === "ACEPTADA" && input.disponibilidadSemana) {
        await tx.disponibilidadSemana.deleteMany({
          where: { usuarioId: input.usuarioId, semanaInicio: input.semanaInicio },
        });
        await tx.disponibilidadSemana.createMany({
          data: input.disponibilidadSemana.map((bloque) => ({
            empresaId: this.empresaId,
            usuarioId: input.usuarioId,
            semanaInicio: input.semanaInicio,
            diaSemana: bloque.diaSemana as DiaSemana,
            horaInicio: bloque.horaInicio,
            horaFin: bloque.horaFin,
          })),
        });
      }
    });
  }
}
