import { prisma } from "@/lib/prisma";
import type { CreateUserRepository } from "@/domains/identity/application/ports/create-user-repository.port";
import type { NuevoUsuarioRol } from "@/domains/identity/domain/alta-usuario.entity";
import type { BloquePlantilla } from "@/domains/shifts/domain/bloque-plantilla";
import type { BloqueDisponibilidad } from "@/domains/employees/domain/bloque-disponibilidad";
import type { CondicionTrabajador } from "@/domains/employees/domain/condiciones-trabajador";
import type { DiaSemana } from "@/generated/prisma/enums";

export class PrismaCreateUserRepository implements CreateUserRepository {
  constructor(private readonly empresaId: string) {}

  async emailEnUso(email: string): Promise<boolean> {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
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

  async crear(input: {
    email: string;
    nombre: string;
    passwordHash: string;
    rol: NuevoUsuarioRol;
    managerId: string | null;
    localNombre: string | null;
    plantilla: BloquePlantilla[];
    localId: string | null;
    disponibilidad: BloqueDisponibilidad[];
    condiciones: CondicionTrabajador[];
  }): Promise<{ usuarioId: string }> {
    return prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email: input.email,
          nombre: input.nombre,
          passwordHash: input.passwordHash,
          rol: input.rol,
          empresaId: this.empresaId,
          managerId: input.managerId,
          localId: input.rol === "EMPLOYEE" ? input.localId : null,
        },
        select: { id: true },
      });

      if (input.rol === "MANAGER") {
        const local = await tx.local.create({
          data: {
            nombre: input.localNombre!,
            empresaId: this.empresaId,
            managerId: usuario.id,
          },
          select: { id: true },
        });
        await tx.plantillaTurno.createMany({
          data: input.plantilla.map((bloque) => ({
            empresaId: this.empresaId,
            localId: local.id,
            diaSemana: bloque.diaSemana as DiaSemana,
            nombre: bloque.nombre,
            horaInicio: bloque.horaInicio,
            horaFin: bloque.horaFin,
            personasRequeridas: bloque.personasRequeridas,
          })),
        });
      } else {
        await tx.disponibilidad.createMany({
          data: input.disponibilidad.map((bloque) => ({
            empresaId: this.empresaId,
            usuarioId: usuario.id,
            diaSemana: bloque.diaSemana as DiaSemana,
            horaInicio: bloque.horaInicio,
            horaFin: bloque.horaFin,
          })),
        });
        if (input.condiciones.length > 0) {
          await tx.condicionTurno.createMany({
            data: input.condiciones.map((condicion) => ({
              empresaId: this.empresaId,
              usuarioId: usuario.id,
              tipo: condicion.tipo,
              minimo: condicion.minimo,
            })),
          });
        }
      }

      return { usuarioId: usuario.id };
    });
  }

  async eliminar(usuarioId: string): Promise<void> {
    await prisma.usuario.delete({ where: { id: usuarioId } });
  }
}
