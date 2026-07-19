import { z } from "zod";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { Rol } from "@/domains/identity/domain/usuario.entity";
import {
  crearBloqueDisponibilidad,
  type BloqueDisponibilidad,
} from "@/domains/employees/domain/bloque-disponibilidad";
import type { SolicitudDisponibilidadRepository } from "@/domains/employees/application/ports/solicitud-disponibilidad-repository.port";

const bloqueSchema = z.object({
  diaSemana: z.string(),
  horaInicio: z.string(),
  horaFin: z.string(),
});

export const resolverSolicitudInputSchema = z.object({
  solicitudId: z.string().min(1),
  estado: z.enum(["ACEPTADA", "RECHAZADA"]),
  respuesta: z.string().optional(),
  // Solo se usa al aceptar: la disponibilidad que regirá esa semana concreta.
  disponibilidad: z.array(bloqueSchema).optional(),
});

export type ResolverSolicitudInput = z.infer<typeof resolverSolicitudInputSchema>;

export type ResolverSolicitudContext = {
  editorId: string;
  editorRol: Rol;
};

/**
 * El manager (o admin) resuelve una solicitud de cambio. Al aceptar, la
 * disponibilidad indicada se guarda como override de esa semana concreta
 * (DisponibilidadSemana), que el motor usará al regenerar; al rechazar, solo se
 * marca el estado con una respuesta opcional. Un MANAGER solo resuelve las de
 * sus propios trabajadores.
 */
export class ResolverSolicitudDisponibilidadCommand {
  constructor(private readonly repo: SolicitudDisponibilidadRepository) {}

  async execute(
    input: ResolverSolicitudInput,
    context: ResolverSolicitudContext,
  ): Promise<Result<{ resuelta: true }>> {
    if (context.editorRol === "EMPLOYEE") {
      return fail(
        new DomainError(
          "No tienes permiso para resolver solicitudes",
          "SOLICITUD_ROL_NO_PERMITIDO",
        ),
      );
    }

    const solicitud = await this.repo.obtenerParaResolver(input.solicitudId);
    if (!solicitud) {
      return fail(
        new DomainError("Solicitud no encontrada", "SOLICITUD_NO_ENCONTRADA"),
      );
    }
    if (
      context.editorRol === "MANAGER" &&
      solicitud.managerId !== context.editorId
    ) {
      return fail(
        new DomainError(
          "Esta solicitud no es de un trabajador a tu cargo",
          "SOLICITUD_NO_AUTORIZADA",
        ),
      );
    }
    if (solicitud.estado !== "PENDIENTE") {
      return fail(
        new DomainError("La solicitud ya estaba resuelta", "SOLICITUD_YA_RESUELTA"),
      );
    }

    let disponibilidadSemana: BloqueDisponibilidad[] | null = null;
    if (input.estado === "ACEPTADA") {
      if (!input.disponibilidad || input.disponibilidad.length === 0) {
        return fail(
          new DomainError(
            "Para aceptar debes definir la disponibilidad de esa semana",
            "SOLICITUD_SIN_DISPONIBILIDAD",
          ),
        );
      }
      const bloques: BloqueDisponibilidad[] = [];
      for (const bloque of input.disponibilidad) {
        const result = crearBloqueDisponibilidad(bloque);
        if (!result.success) return result;
        bloques.push(result.value);
      }
      disponibilidadSemana = bloques;
    }

    await this.repo.resolver({
      solicitudId: solicitud.id,
      usuarioId: solicitud.usuarioId,
      semanaInicio: solicitud.semanaInicio,
      estado: input.estado,
      respuesta: input.respuesta?.trim() || null,
      resueltaPorId: context.editorId,
      disponibilidadSemana,
    });

    return ok({ resuelta: true });
  }
}
