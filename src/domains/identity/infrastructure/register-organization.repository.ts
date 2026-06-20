import { prisma } from "@/lib/prisma";
import type { RegisterOrganizationRepository } from "@/domains/identity/application/ports/register-organization-repository.port";
import type { BloquePlantilla } from "@/domains/shifts/domain/bloque-plantilla";
import type { DiaSemana } from "@/generated/prisma/enums";

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
    localNombre: string | null;
    plantilla: BloquePlantilla[];
  }): Promise<{ empresaId: string; usuarioId: string }> {
    return prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
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

      if (input.localNombre) {
        const local = await tx.local.create({
          data: {
            nombre: input.localNombre,
            empresaId: usuario.empresaId,
            managerId: usuario.id,
          },
          select: { id: true },
        });
        await tx.plantillaTurno.createMany({
          data: input.plantilla.map((bloque) => ({
            empresaId: usuario.empresaId,
            localId: local.id,
            diaSemana: bloque.diaSemana as DiaSemana,
            nombre: bloque.nombre,
            horaInicio: bloque.horaInicio,
            horaFin: bloque.horaFin,
            personasRequeridas: bloque.personasRequeridas,
          })),
        });
      }

      return { empresaId: usuario.empresaId, usuarioId: usuario.id };
    });
  }
}
