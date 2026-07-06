import { z } from "zod";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { TurnoRepository } from "@/domains/scheduling/application/ports/turno-repository.port";
import {
  puedeGestionarLocal,
  type TurnoCommandContext,
} from "@/domains/scheduling/application/turno-authz";
import { fechaLocalSchema } from "@/domains/scheduling/application/fecha-local";
import { inicioSemana } from "@/domains/scheduling/domain/semana";
import {
  disponibilidadCubre,
  intervalosSolapan,
} from "@/domains/scheduling/domain/solapamiento";

export const createTurnoInputSchema = z.object({
  localId: z.string().min(1),
  usuarioId: z.string().min(1),
  inicio: fechaLocalSchema,
  fin: fechaLocalSchema,
});

export type CreateTurnoInput = z.infer<typeof createTurnoInputSchema>;

/** Crea un turno manual. Queda marcado con `metadata.origen = "manual"`. */
export class CreateTurnoCommand {
  constructor(private readonly repo: TurnoRepository) {}

  async execute(
    input: CreateTurnoInput,
    context: TurnoCommandContext,
  ): Promise<Result<{ id: string; advertencias: string[] }>> {
    const local = await this.repo.buscarLocal(input.localId);
    if (!local) {
      return fail(new DomainError("Local no encontrado", "LOCAL_NO_ENCONTRADO"));
    }

    if (!puedeGestionarLocal(context, local.managerId)) {
      return fail(new DomainError("No autorizado", "NO_AUTORIZADO"));
    }

    if (input.fin.getTime() <= input.inicio.getTime()) {
      return fail(
        new DomainError(
          "La hora de fin debe ser posterior al inicio",
          "HORAS_INVERTIDAS",
        ),
      );
    }

    const empleados = await this.repo.empleadosDeLocal(input.localId);
    const empleadoDestino = empleados.find((e) => e.id === input.usuarioId);
    if (!empleadoDestino) {
      return fail(
        new DomainError(
          "El empleado no pertenece a este local",
          "EMPLEADO_FUERA_DE_LOCAL",
        ),
      );
    }

    const turnosSemana = await this.repo.turnosDeLocalEnSemana(
      input.localId,
      inicioSemana(input.inicio),
    );
    const solapa = turnosSemana.some(
      (t) =>
        t.usuarioId === input.usuarioId &&
        intervalosSolapan({ inicio: input.inicio, fin: input.fin }, t),
    );
    if (solapa) {
      return fail(
        new DomainError(
          "El turno se solapa con otro del empleado",
          "TURNO_SOLAPADO",
        ),
      );
    }

    const advertencias: string[] = [];
    if (
      !disponibilidadCubre(empleadoDestino.disponibilidad, {
        inicio: input.inicio,
        fin: input.fin,
      })
    ) {
      advertencias.push(
        "El empleado no tiene disponibilidad declarada para esta franja",
      );
    }

    const { id } = await this.repo.crearTurno({
      usuarioId: input.usuarioId,
      inicio: input.inicio,
      fin: input.fin,
      metadata: { origen: "manual" },
    });

    return ok({ id, advertencias });
  }
}
