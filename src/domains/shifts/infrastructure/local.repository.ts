import { prisma } from "@/lib/prisma";
import type {
  LocalConManager,
  LocalRepository,
} from "@/domains/shifts/application/ports/local-repository.port";
import type { BloquePlantilla } from "@/domains/shifts/domain/bloque-plantilla";
import type { DiaSemana } from "@/generated/prisma/enums";

export class PrismaLocalRepository implements LocalRepository {
  constructor(private readonly empresaId: string) {}

  async obtenerConManager(id: string): Promise<LocalConManager | null> {
    return prisma.local.findFirst({
      where: { id, empresaId: this.empresaId },
      select: { id: true, nombre: true, managerId: true },
    });
  }

  async actualizarPlantilla(input: {
    localId: string;
    nombre: string;
    plantilla: BloquePlantilla[];
  }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.local.update({
        where: { id: input.localId },
        data: { nombre: input.nombre },
      });
      await tx.plantillaTurno.deleteMany({ where: { localId: input.localId } });
      await tx.plantillaTurno.createMany({
        data: input.plantilla.map((bloque) => ({
          empresaId: this.empresaId,
          localId: input.localId,
          diaSemana: bloque.diaSemana as DiaSemana,
          nombre: bloque.nombre,
          horaInicio: bloque.horaInicio,
          horaFin: bloque.horaFin,
          personasRequeridas: bloque.personasRequeridas,
        })),
      });
    });
  }

  async eliminar(id: string): Promise<void> {
    await prisma.local.delete({ where: { id } });
  }
}
