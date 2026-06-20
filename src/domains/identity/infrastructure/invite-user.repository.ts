import { prisma } from "@/lib/prisma";
import { TenantRepository } from "@/shared/kernel/tenant-repository";
import type { InviteUserRepository } from "@/domains/identity/application/ports/invite-user-repository.port";

export class PrismaInviteUserRepository
  extends TenantRepository
  implements InviteUserRepository
{
  async emailEnUso(email: string): Promise<boolean> {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });
    return usuario !== null;
  }

  async invitacionPendienteExiste(email: string): Promise<boolean> {
    const invitacion = await this.db.invitacion.findFirst({
      where: { email, aceptadaEn: null, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    return invitacion !== null;
  }

  async managerPerteneceATenant(managerId: string): Promise<boolean> {
    const manager = await this.db.usuario.findFirst({
      where: { id: managerId, rol: "MANAGER" },
      select: { id: true },
    });
    return manager !== null;
  }

  async localesDeManager(managerId: string): Promise<{ id: string }[]> {
    return this.db.local.findMany({
      where: { managerId },
      select: { id: true },
    });
  }

  async crear(input: {
    email: string;
    rol: "MANAGER" | "EMPLOYEE";
    managerId: string | null;
    invitadoPorId: string;
    token: string;
    expiresAt: Date;
    datosAdicionales: unknown;
  }): Promise<{ invitacionId: string }> {
    const invitacion = await this.db.invitacion.create({
      data: {
        email: input.email,
        rol: input.rol,
        managerId: input.managerId,
        invitadoPorId: input.invitadoPorId,
        token: input.token,
        expiresAt: input.expiresAt,
        datosAdicionales: input.datosAdicionales as object,
        empresaId: this.empresaId,
      },
      select: { id: true },
    });
    return { invitacionId: invitacion.id };
  }

  async eliminar(invitacionId: string): Promise<void> {
    await this.db.invitacion.delete({ where: { id: invitacionId } });
  }
}
