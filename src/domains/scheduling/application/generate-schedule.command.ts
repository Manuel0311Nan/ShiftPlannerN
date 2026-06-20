import { z } from "zod";
import {
  generarAsignaciones,
  calcularFechasBloque,
} from "@/domains/scheduling/domain/generar-asignaciones";
import type { Rol } from "@/domains/identity/domain/usuario.entity";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { GenerateScheduleRepository } from "@/domains/scheduling/application/ports/generate-schedule-repository.port";

// No usar z.coerce.date(): un string "YYYY-MM-DD" se interpreta como
// medianoche UTC, pero el resto del feature (página de horarios, helper
// de fechas) trabaja en medianoche local — parsear a mano evita que
// "el lunes" represente momentos distintos según dónde se construya.
export const generateScheduleInputSchema = z.object({
  localId: z.string().min(1),
  semanaInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform((value) => {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(year, month - 1, day);
    }),
});

export type GenerateScheduleInput = z.infer<typeof generateScheduleInputSchema>;

export type GenerateScheduleContext = {
  invitadoPorId: string;
  invitadoPorRol: Rol;
};

export type HuecoReporte = { dia: string; nombre: string; faltan: number };

export class GenerateScheduleCommand {
  constructor(private readonly repo: GenerateScheduleRepository) {}

  async execute(
    input: GenerateScheduleInput,
    context: GenerateScheduleContext,
  ): Promise<Result<{ turnosCreados: number; huecos: HuecoReporte[] }>> {
    const local = await this.repo.buscarLocal(input.localId);
    if (!local) {
      return fail(new DomainError("Local no encontrado", "LOCAL_NO_ENCONTRADO"));
    }
    if (
      context.invitadoPorRol === "MANAGER" &&
      local.managerId !== context.invitadoPorId
    ) {
      return fail(
        new DomainError("Este local no es tuyo", "LOCAL_NO_AUTORIZADO"),
      );
    }

    const bloques = await this.repo.bloquesDeLocal(input.localId);
    const empleados = await this.repo.empleadosConDisponibilidad(input.localId);

    await this.repo.borrarTurnosGenerados(input.localId, input.semanaInicio);

    const { asignaciones, huecos } = generarAsignaciones(bloques, empleados);

    const turnos = asignaciones.map((asignacion) => {
      const bloque = bloques.find((b) => b.id === asignacion.bloqueId)!;
      const { inicio, fin } = calcularFechasBloque(input.semanaInicio, bloque);
      return { usuarioId: asignacion.usuarioId, inicio, fin };
    });

    await this.repo.crearTurnos(turnos);

    const huecosReporte: HuecoReporte[] = huecos.map((hueco) => {
      const bloque = bloques.find((b) => b.id === hueco.bloqueId)!;
      return { dia: bloque.diaSemana, nombre: bloque.nombre, faltan: hueco.faltan };
    });

    return ok({ turnosCreados: turnos.length, huecos: huecosReporte });
  }
}
