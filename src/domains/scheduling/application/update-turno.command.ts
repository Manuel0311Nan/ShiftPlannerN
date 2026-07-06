import { z } from "zod";
import type { Result } from "@/shared/kernel/result";
import type { TurnoRepository } from "@/domains/scheduling/application/ports/turno-repository.port";
import type { TurnoCommandContext } from "@/domains/scheduling/application/turno-authz";
import { fechaLocalSchema } from "@/domains/scheduling/application/fecha-local";
import { reposicionarTurno } from "@/domains/scheduling/application/reposicionar-turno.core";

export const updateTurnoInputSchema = z.object({
  turnoId: z.string().min(1),
  inicio: fechaLocalSchema,
  fin: fechaLocalSchema,
});

export type UpdateTurnoInput = z.infer<typeof updateTurnoInputSchema>;

/** Edita solo las horas (duración) de un turno, sin cambiar de empleado. */
export class UpdateTurnoCommand {
  constructor(private readonly repo: TurnoRepository) {}

  execute(
    input: UpdateTurnoInput,
    context: TurnoCommandContext,
  ): Promise<Result<{ advertencias: string[] }>> {
    return reposicionarTurno(this.repo, {
      turnoId: input.turnoId,
      inicio: input.inicio,
      fin: input.fin,
      context,
    });
  }
}
