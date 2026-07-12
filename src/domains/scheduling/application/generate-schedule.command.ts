import { z } from "zod";
import { calcularFechasBloque } from "@/domains/scheduling/domain/generar-asignaciones";
import {
  construirModelo,
  construirModeloElastico,
  interpretarSolucion,
} from "@/domains/scheduling/domain/generar-asignaciones-ilp";
import type { Rol } from "@/domains/identity/domain/usuario.entity";
import type { TipoTurno } from "@/shared/kernel/tipo-turno";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { GenerateScheduleRepository } from "@/domains/scheduling/application/ports/generate-schedule-repository.port";
import type { ScheduleSolver } from "@/domains/scheduling/application/ports/schedule-solver.port";

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
export type CondicionIncumplida = {
  usuarioNombre: string;
  tipo: TipoTurno;
  faltan: number;
};

export type GenerateScheduleResult = {
  generado: boolean;
  turnosCreados: number;
  huecos: HuecoReporte[];
  condicionesIncumplidas: CondicionIncumplida[];
};

export class GenerateScheduleCommand {
  constructor(
    private readonly repo: GenerateScheduleRepository,
    private readonly solver: ScheduleSolver,
  ) {}

  async execute(
    input: GenerateScheduleInput,
    context: GenerateScheduleContext,
  ): Promise<Result<GenerateScheduleResult>> {
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
    const empleados = await this.repo.empleadosParaOptimizacion(input.localId);

    const { modelo, meta } = construirModelo({ bloques, empleados });
    const solucion = this.solver.resolver(modelo);

    // Ante infactibilidad de las condiciones duras: diagnosticar con el modelo
    // elástico (mínimos blandos) y reportar el déficit sin persistir nada.
    if (solucion.status !== "optimal") {
      const elastico = construirModeloElastico({ bloques, empleados });
      const diagnostico = this.solver.resolver(elastico.modelo);
      const { deficits } = interpretarSolucion(diagnostico, elastico.meta);
      const nombrePorId = new Map(empleados.map((e) => [e.id, e.nombre]));
      const condicionesIncumplidas: CondicionIncumplida[] = deficits.map(
        (deficit) => ({
          usuarioNombre: nombrePorId.get(deficit.usuarioId) ?? "",
          tipo: deficit.tipo,
          faltan: deficit.faltan,
        }),
      );
      return ok({
        generado: false,
        turnosCreados: 0,
        huecos: [],
        condicionesIncumplidas,
      });
    }

    const { asignaciones, huecos } = interpretarSolucion(solucion, meta);

    await this.repo.borrarTurnosGenerados(input.localId, input.semanaInicio);

    const bloquePorId = new Map(bloques.map((b) => [b.id, b]));
    const turnos = asignaciones.map((asignacion) => {
      const bloque = bloquePorId.get(asignacion.bloqueId)!;
      const { inicio, fin } = calcularFechasBloque(input.semanaInicio, bloque);
      return { usuarioId: asignacion.usuarioId, inicio, fin };
    });

    await this.repo.crearTurnos(turnos);

    const huecosReporte: HuecoReporte[] = huecos.map((hueco) => {
      const bloque = bloquePorId.get(hueco.bloqueId)!;
      return { dia: bloque.diaSemana, nombre: bloque.nombre, faltan: hueco.faltan };
    });

    return ok({
      generado: true,
      turnosCreados: turnos.length,
      huecos: huecosReporte,
      condicionesIncumplidas: [],
    });
  }
}
