import { z } from "zod";
import type { Result } from "@/shared/kernel/result";
import type { TurnoRepository } from "@/domains/scheduling/application/ports/turno-repository.port";
import type { TurnoCommandContext } from "@/domains/scheduling/application/turno-authz";
import { fechaLocalSchema } from "@/domains/scheduling/application/fecha-local";
import { reposicionarTurno } from "@/domains/scheduling/application/reposicionar-turno.core";

export const moveTurnoInputSchema = z.object({
  turnoId: z.string().min(1),
  inicio: fechaLocalSchema,
  fin: fechaLocalSchema,
  // Presente solo si se reasigna a otro empleado; ausente = mover en el tiempo.
  usuarioId: z.string().min(1).optional(),
});

export type MoveTurnoInput = z.infer<typeof moveTurnoInputSchema>;

/** Mueve un turno (día/hora) y/o lo reasigna a otro empleado del local. */
export class MoveTurnoCommand {
  constructor(private readonly repo: TurnoRepository) {}

  execute(
    input: MoveTurnoInput,
    context: TurnoCommandContext,
  ): Promise<Result<{ advertencias: string[] }>> {
    return reposicionarTurno(this.repo, {
      turnoId: input.turnoId,
      inicio: input.inicio,
      fin: input.fin,
      reasignarA: input.usuarioId,
      context,
    });
  }
}
