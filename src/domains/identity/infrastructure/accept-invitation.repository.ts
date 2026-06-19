import { prisma } from "@/lib/prisma";
import { DomainError } from "@/shared/kernel/result";
import type {
  AcceptInvitationRepository,
  InvitacionPorToken,
} from "@/domains/identity/application/ports/accept-invitation-repository.port";

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

      await tx.invitacion.update({
        where: { id: invitacion.id },
        data: { aceptadaEn: new Date() },
      });

      return { usuarioId: usuario.id, empresaId: usuario.empresaId };
    });
  }
}
