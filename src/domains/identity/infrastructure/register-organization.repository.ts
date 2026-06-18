import { prisma } from "@/lib/prisma";
import type { RegisterOrganizationRepository } from "@/domains/identity/application/ports/register-organization-repository.port";

export class PrismaRegisterOrganizationRepository
  implements RegisterOrganizationRepository
{
  async emailEnUso(email: string): Promise<boolean> {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });
    return usuario !== null;
  }

  async crear(input: {
    empresaNombre: string;
    trialEndsAt: Date;
    adminEmail: string;
    adminNombre: string;
    adminPasswordHash: string;
  }): Promise<{ empresaId: string; usuarioId: string }> {
    const usuario = await prisma.usuario.create({
      data: {
        email: input.adminEmail,
        nombre: input.adminNombre,
        passwordHash: input.adminPasswordHash,
        rol: "ADMIN",
        empresa: {
          create: {
            nombre: input.empresaNombre,
            trialEndsAt: input.trialEndsAt,
          },
        },
      },
      select: { id: true, empresaId: true },
    });

    return { empresaId: usuario.empresaId, usuarioId: usuario.id };
  }
}
