import { prisma } from "@/lib/prisma";
import { DomainError } from "@/shared/kernel/result";
import {
  managerDatosAdicionalesSchema,
  employeeDatosAdicionalesSchema,
} from "@/domains/identity/application/invitacion-datos-adicionales.schema";
import type {
  AcceptInvitationRepository,
  InvitacionPorToken,
} from "@/domains/identity/application/ports/accept-invitation-repository.port";
import type { DiaSemana } from "@/generated/prisma/enums";

export class PrismaAcceptInvitationRepository
  implements AcceptInvitationRepository
{
  async buscarPorToken(token: string): Promise<InvitacionPorToken | null> {
    return prisma.invitacion.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        rol: true,
        empresaId: true,
        managerId: true,
        expiresAt: true,
        aceptadaEn: true,
      },
    });
  }

  async aceptarYCrearUsuario(input: {
    invitacionId: string;
    nombre: string;
    passwordHash: string;
  }): Promise<{ usuarioId: string; empresaId: string }> {
    return prisma.$transaction(async (tx) => {
      const invitacion = await tx.invitacion.findUniqueOrThrow({
        where: { id: input.invitacionId },
      });

      if (invitacion.aceptadaEn) {
        throw new DomainError(
          "Esta invitación ya fue utilizada",
          "INVITACION_YA_ACEPTADA",
        );
      }

      const usuario = await tx.usuario.create({
        data: {
          email: invitacion.email,
          nombre: input.nombre,
          passwordHash: input.passwordHash,
          rol: invitacion.rol,
          empresaId: invitacion.empresaId,
          managerId: invitacion.managerId,
        },
        select: { id: true, empresaId: true },
      });

      if (invitacion.rol === "MANAGER") {
        const datos = managerDatosAdicionalesSchema.parse(
          invitacion.datosAdicionales,
        );
        const local = await tx.local.create({
          data: {
            nombre: datos.localNombre,
            empresaId: invitacion.empresaId,
            managerId: usuario.id,
          },
          select: { id: true },
        });
        await tx.plantillaTurno.createMany({
          data: datos.plantilla.map((bloque) => ({
            empresaId: invitacion.empresaId,
            localId: local.id,
            diaSemana: bloque.diaSemana as DiaSemana,
            nombre: bloque.nombre,
            horaInicio: bloque.horaInicio,
            horaFin: bloque.horaFin,
            personasRequeridas: bloque.personasRequeridas,
          })),
        });
      } else {
        const datos = employeeDatosAdicionalesSchema.parse(
          invitacion.datosAdicionales,
        );
        if (datos.localId) {
          await tx.usuario.update({
            where: { id: usuario.id },
            data: { localId: datos.localId },
          });
        }
        await tx.disponibilidad.createMany({
          data: datos.disponibilidad.map((bloque) => ({
            empresaId: invitacion.empresaId,
            usuarioId: usuario.id,
            diaSemana: bloque.diaSemana as DiaSemana,
            horaInicio: bloque.horaInicio,
            horaFin: bloque.horaFin,
          })),
        });
      }

      await tx.invitacion.update({
        where: { id: invitacion.id },
        data: { aceptadaEn: new Date() },
      });

      return { usuarioId: usuario.id, empresaId: usuario.empresaId };
    });
  }
}
