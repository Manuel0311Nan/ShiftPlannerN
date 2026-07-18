import { z } from "zod";
import {
  calcularFechasBloque,
  type BloqueRequerido,
} from "@/domains/scheduling/domain/generar-asignaciones";
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
  // El checkbox llega como "on" (marcado) o ausente; lo normalizamos a boolean.
  permitirHorasExtra: z
    .union([z.literal("on"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "on"),
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
export type HorasIncumplidas = { usuarioNombre: string; faltan: number };

export type GenerateScheduleResult = {
  generado: boolean;
  /** true si se generó lo posible pero quedaron condiciones sin cubrir. */
  parcial: boolean;
  turnosCreados: number;
  huecos: HuecoReporte[];
  condicionesIncumplidas: CondicionIncumplida[];
  /** Trabajadores que no alcanzan sus horas de contrato, con las horas que faltan. */
  horasIncumplidas: HorasIncumplidas[];
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

    const bloquePorId = new Map(bloques.map((b) => [b.id, b]));
    const mapearHuecos = (
      huecos: { bloqueId: string; faltan: number }[],
    ): HuecoReporte[] =>
      huecos.map((hueco) => {
        const bloque = bloquePorId.get(hueco.bloqueId)!;
        return { dia: bloque.diaSemana, nombre: bloque.nombre, faltan: hueco.faltan };
      });

    const { modelo, meta } = construirModelo({
      bloques,
      empleados,
      permitirHorasExtra: input.permitirHorasExtra,
    });
    const solucion = this.solver.resolver(modelo);

    const nombrePorId = new Map(empleados.map((e) => [e.id, e.nombre]));

    // Ante infactibilidad de las condiciones duras: en vez de abortar, generamos
    // lo que sí es posible con el modelo elástico (mínimos blandos) y reportamos
    // qué condiciones quedan por cubrir a mano. La única fuente de infactibilidad
    // son los mínimos por tipo, así que el elástico da la mejor precarga posible.
    if (solucion.status !== "optimal") {
      const elastico = construirModeloElastico({
        bloques,
        empleados,
        permitirHorasExtra: input.permitirHorasExtra,
      });
      const diagnostico = this.solver.resolver(elastico.modelo);
      const { asignaciones, huecos, deficits, horasDeficits } =
        interpretarSolucion(diagnostico, elastico.meta);
      const condicionesIncumplidas: CondicionIncumplida[] = deficits.map(
        (deficit) => ({
          usuarioNombre: nombrePorId.get(deficit.usuarioId) ?? "",
          tipo: deficit.tipo,
          faltan: deficit.faltan,
        }),
      );
      const horasIncumplidas: HorasIncumplidas[] = horasDeficits.map(
        (deficit) => ({
          usuarioNombre: nombrePorId.get(deficit.usuarioId) ?? "",
          faltan: deficit.faltan,
        }),
      );

      const turnosCreados = await this.persistir(input, asignaciones, bloquePorId);
      return ok({
        generado: turnosCreados > 0,
        parcial: true,
        turnosCreados,
        huecos: mapearHuecos(huecos),
        condicionesIncumplidas,
        horasIncumplidas,
      });
    }

    const { asignaciones, huecos } = interpretarSolucion(solucion, meta);
    const turnosCreados = await this.persistir(input, asignaciones, bloquePorId);

    return ok({
      generado: true,
      parcial: false,
      turnosCreados,
      huecos: mapearHuecos(huecos),
      condicionesIncumplidas: [],
      horasIncumplidas: [],
    });
  }

  /** Reemplaza los turnos generados de la semana por las asignaciones dadas. */
  private async persistir(
    input: GenerateScheduleInput,
    asignaciones: { usuarioId: string; bloqueId: string }[],
    bloquePorId: Map<string, BloqueRequerido>,
  ): Promise<number> {
    await this.repo.borrarTurnosGenerados(input.localId, input.semanaInicio);
    const turnos = asignaciones.map((asignacion) => {
      const bloque = bloquePorId.get(asignacion.bloqueId)!;
      const { inicio, fin } = calcularFechasBloque(input.semanaInicio, bloque);
      return { usuarioId: asignacion.usuarioId, inicio, fin };
    });
    await this.repo.crearTurnos(turnos);
    return turnos.length;
  }
}
