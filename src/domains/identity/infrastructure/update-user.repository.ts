import { prisma } from "@/lib/prisma";
import type {
  UpdateUserRepository,
  UsuarioEditable,
} from "@/domains/identity/application/ports/update-user-repository.port";
import type { BloqueDisponibilidad } from "@/domains/employees/domain/bloque-disponibilidad";
import type { Rol } from "@/domains/identity/domain/usuario.entity";
import type { DiaSemana } from "@/generated/prisma/enums";

export class PrismaUpdateUserRepository implements UpdateUserRepository {
  constructor(private readonly empresaId: string) {}

  async obtener(id: string): Promise<UsuarioEditable | null> {
    const usuario = await prisma.usuario.findFirst({
      where: { id, empresaId: this.empresaId },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        managerId: true,
        localId: true,
      },
    });
    if (!usuario) return null;
    return { ...usuario, rol: usuario.rol as Rol };
  }

  async emailEnUsoPorOtro(email: string, exceptoId: string): Promise<boolean> {
    const usuario = await prisma.usuario.findFirst({
      where: { email, NOT: { id: exceptoId } },
      select: { id: true },
    });
    return usuario !== null;
  }

  async localesDeManager(managerId: string): Promise<{ id: string }[]> {
    return prisma.local.findMany({
      where: { managerId, empresaId: this.empresaId },
      select: { id: true },
    });
  }

  async actualizar(input: {
    id: string;
    nombre: string;
    email: string;
    managerId: string | null;
    localId: string | null;
    disponibilidad: BloqueDisponibilidad[] | null;
    horasContrato: number | null;
    diasLibres: number | null;
  }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: input.id },
        data: {
          nombre: input.nombre,
          email: input.email,
          managerId: input.managerId,
          localId: input.localId,
          ...(input.horasContrato !== null
            ? { horasContrato: input.horasContrato }
            : {}),
          ...(input.diasLibres !== null
            ? { diasLibres: input.diasLibres }
            : {}),
        },
      });

      if (input.disponibilidad !== null) {
        await tx.disponibilidad.deleteMany({ where: { usuarioId: input.id } });
        await tx.disponibilidad.createMany({
          data: input.disponibilidad.map((bloque) => ({
            empresaId: this.empresaId,
            usuarioId: input.id,
            diaSemana: bloque.diaSemana as DiaSemana,
            horaInicio: bloque.horaInicio,
            horaFin: bloque.horaFin,
          })),
        });
      }
    });
  }

  async eliminar(id: string): Promise<void> {
    await prisma.usuario.delete({ where: { id } });
  }
}
