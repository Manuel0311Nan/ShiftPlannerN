import { z } from "zod";
import { ok, type Result } from "@/shared/kernel/result";
import { inicioSemana } from "@/domains/scheduling/domain/semana";
import { crearSolicitudDisponibilidad } from "@/domains/employees/domain/solicitud-disponibilidad";
import type { SolicitudDisponibilidadRepository } from "@/domains/employees/application/ports/solicitud-disponibilidad-repository.port";

// El input llega de un formulario: la semana como "YYYY-MM-DD" (cualquier día
// de la semana afectada) se parsea a medianoche local y luego se normaliza al
// lunes, igual que el resto del feature de horarios.
export const crearSolicitudInputSchema = z.object({
  semanaInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform((value) => {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(year, month - 1, day);
    }),
  motivo: z.string(),
});

export type CrearSolicitudInput = z.infer<typeof crearSolicitudInputSchema>;

export class CrearSolicitudDisponibilidadCommand {
  constructor(private readonly repo: SolicitudDisponibilidadRepository) {}

  async execute(
    input: CrearSolicitudInput,
    context: { usuarioId: string },
  ): Promise<Result<{ creada: true }>> {
    const semanaInicio = inicioSemana(input.semanaInicio);
    const validacion = crearSolicitudDisponibilidad({
      semanaInicio,
      motivo: input.motivo,
      ahora: new Date(),
    });
    if (!validacion.success) return validacion;

    await this.repo.crear({
      usuarioId: context.usuarioId,
      semanaInicio: validacion.value.semanaInicio,
      motivo: validacion.value.motivo,
    });

    return ok({ creada: true });
  }
}
