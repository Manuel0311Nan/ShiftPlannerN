import { z } from "zod";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { TurnoRepository } from "@/domains/scheduling/application/ports/turno-repository.port";
import {
  puedeGestionarLocal,
  type TurnoCommandContext,
} from "@/domains/scheduling/application/turno-authz";

export const deleteTurnoInputSchema = z.object({
  turnoId: z.string().min(1),
});

export type DeleteTurnoInput = z.infer<typeof deleteTurnoInputSchema>;

/** Borra un turno. Solo ADMIN o el MANAGER dueño del local del turno. */
export class DeleteTurnoCommand {
  constructor(private readonly repo: TurnoRepository) {}

  async execute(
    input: DeleteTurnoInput,
    context: TurnoCommandContext,
  ): Promise<Result<{ id: string }>> {
    const turno = await this.repo.buscarTurno(input.turnoId);
    if (!turno) {
      return fail(new DomainError("Turno no encontrado", "TURNO_NO_ENCONTRADO"));
    }

    if (!puedeGestionarLocal(context, turno.managerId)) {
      return fail(new DomainError("No autorizado", "NO_AUTORIZADO"));
    }

    await this.repo.borrarTurno(turno.id);
    return ok({ id: turno.id });
  }
}
