import { z } from "zod";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import {
  crearBloquePlantilla,
  type BloquePlantilla,
} from "@/domains/shifts/domain/bloque-plantilla";
import {
  puedeGestionarLocal,
  type TurnoCommandContext,
} from "@/domains/scheduling/application/turno-authz";
import type { LocalRepository } from "@/domains/shifts/application/ports/local-repository.port";

const bloquePlantillaSchema = z.object({
  diaSemana: z.string(),
  nombre: z.string(),
  horaInicio: z.string(),
  horaFin: z.string(),
  personasRequeridas: z.coerce.number().int(),
});

export const updateLocalInputSchema = z.object({
  localId: z.string().min(1),
  nombre: z.string().min(2),
  plantilla: z.array(bloquePlantillaSchema),
});

export type UpdateLocalInput = z.infer<typeof updateLocalInputSchema>;

/**
 * Edita el nombre y el horario semanal (plantilla) de un local ya creado.
 * Autorización idéntica a la de turnos: ADMIN cualquier local de su empresa,
 * MANAGER solo el que gestiona. Reemplazo total de los bloques de plantilla.
 */
export class UpdateLocalCommand {
  constructor(private readonly repo: LocalRepository) {}

  async execute(
    input: UpdateLocalInput,
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
          "No tienes permiso para editar este local",
          "LOCAL_NO_AUTORIZADO",
        ),
      );
    }

    const nombre = input.nombre.trim();
    if (nombre.length < 2) {
      return fail(
        new DomainError(
          "El nombre del local debe tener al menos 2 caracteres",
          "LOCAL_NOMBRE_INVALIDO",
        ),
      );
    }

    if (input.plantilla.length === 0) {
      return fail(
        new DomainError(
          "El local necesita al menos un bloque de turno",
          "LOCAL_PLANTILLA_VACIA",
        ),
      );
    }
    const bloques: BloquePlantilla[] = [];
    for (const bloque of input.plantilla) {
      const result = crearBloquePlantilla(bloque);
      if (!result.success) return result;
      bloques.push(result.value);
    }

    await this.repo.actualizarPlantilla({
      localId: local.id,
      nombre,
      plantilla: bloques,
    });

    return ok({ localId: local.id });
  }
}
