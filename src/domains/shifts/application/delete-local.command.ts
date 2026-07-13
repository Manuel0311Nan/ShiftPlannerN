import { z } from "zod";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import {
  puedeGestionarLocal,
  type TurnoCommandContext,
} from "@/domains/scheduling/application/turno-authz";
import type { LocalRepository } from "@/domains/shifts/application/ports/local-repository.port";

export const deleteLocalInputSchema = z.object({
  localId: z.string().min(1),
});

export type DeleteLocalInput = z.infer<typeof deleteLocalInputSchema>;

/**
 * Elimina un local. Misma autorización que la edición. El schema gestiona la
 * cascada: se borran sus `PlantillaTurno` y los empleados del local quedan
 * con `localId` a null (`onDelete: SetNull`).
 */
export class DeleteLocalCommand {
  constructor(private readonly repo: LocalRepository) {}

  async execute(
    input: DeleteLocalInput,
    context: TurnoCommandContext,
  ): Promise<Result<{ localId: string }>> {
    const local = await this.repo.obtenerConManager(input.localId);
    if (!local) {
      return fail(
        new DomainError("Local no encontrado", "LOCAL_NO_ENCONTRADO"),
      );
    }

    if (!puedeGestionarLocal(context, local.managerId)) {
      return fail(
        new DomainError(
          "No tienes permiso para eliminar este local",
          "LOCAL_NO_AUTORIZADO",
        ),
      );
    }

    await this.repo.eliminar(local.id);
    return ok({ localId: local.id });
  }
}
