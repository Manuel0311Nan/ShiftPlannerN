import { describe, expect, it } from "vitest";
import {
  GenerateScheduleCommand,
  type GenerateScheduleContext,
} from "@/domains/scheduling/application/generate-schedule.command";
import type {
  EmpleadoParaOptimizacion,
  GenerateScheduleRepository,
} from "@/domains/scheduling/application/ports/generate-schedule-repository.port";
import type {
  BloqueRequerido,
  Empleado,
} from "@/domains/scheduling/domain/generar-asignaciones";
import { YalpsScheduleSolver } from "@/domains/scheduling/infrastructure/yalps-solver";

// Escenarios de extremo a extremo del generador, escritos como documentación
// ejecutable: cada test reproduce una plantilla de local + trabajadores +
// condiciones + horas de contrato tal como se introducen en la UI, y comprueba
// si el horario se genera limpio o queda "parcial" y por qué.

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"] as const;

/**
 * Plantilla del local con dos bloques por día (mañana y tarde), como la que
 * define un manager al configurar el horario semanal del local. La tarde es el
 * bloque de cierre; la mañana, el de apertura; trabajar ambos el mismo día es
 * un turno partido. Cada bloque dura 5h.
 */
function plantillaDosBloques(personas = 1): BloqueRequerido[] {
  const bloques: BloqueRequerido[] = [];
  for (const dia of DIAS) {
    bloques.push({
      id: `${dia}_manana`,
      nombre: "Mañana",
      diaSemana: dia,
      horaInicio: "09:00",
      horaFin: "14:00",
      personasRequeridas: personas,
    });
    bloques.push({
      id: `${dia}_tarde`,
      nombre: "Tarde",
      diaSemana: dia,
      horaInicio: "16:00",
      horaFin: "21:00",
      personasRequeridas: personas,
    });
  }
  return bloques;
}

class FakeRepo implements GenerateScheduleRepository {
  turnosCreados: { usuarioId: string; inicio: Date; fin: Date }[] = [];

  constructor(
    private readonly bloques: BloqueRequerido[],
    private readonly empleados: EmpleadoParaOptimizacion[],
  ) {}

  async buscarLocal() {
    return { id: "local-1", managerId: "mgr-1" };
  }
  async bloquesDeLocal() {
    return this.bloques;
  }
  async empleadosConDisponibilidad(): Promise<Empleado[]> {
    return this.empleados.map((e) => ({ id: e.id, disponibilidad: e.disponibilidad }));
  }
  async empleadosParaOptimizacion() {
    return this.empleados;
  }
  async borrarTurnosGenerados() {}
  async crearTurnos(turnos: { usuarioId: string; inicio: Date; fin: Date }[]) {
    this.turnosCreados = turnos;
  }
}

const ADMIN: GenerateScheduleContext = {
  invitadoPorId: "admin",
  invitadoPorRol: "ADMIN",
};
const SEMANA = new Date(2026, 0, 5);

async function generar(
  bloques: BloqueRequerido[],
  empleados: EmpleadoParaOptimizacion[],
  permitirHorasExtra = false,
) {
  const repo = new FakeRepo(bloques, empleados);
  const result = await new GenerateScheduleCommand(
    repo,
    new YalpsScheduleSolver(),
  ).execute(
    { localId: "local-1", semanaInicio: SEMANA, permitirHorasExtra },
    ADMIN,
  );
  return { result, repo };
}

/** Horas totales asignadas a un trabajador en los turnos generados. */
function horasDe(
  repo: FakeRepo,
  usuarioId: string,
): number {
  return repo.turnosCreados
    .filter((t) => t.usuarioId === usuarioId)
    .reduce((h, t) => h + (t.fin.getTime() - t.inicio.getTime()) / 3_600_000, 0);
}

/** Disponibilidad "todo el día" para una lista de días. */
function todoElDia(dias: readonly (typeof DIAS)[number][]) {
  return dias.map((dia) => ({ diaSemana: dia, horaInicio: "00:00", horaFin: "23:59" }));
}

describe("Generación de horarios — escenarios realistas", () => {
  it("SetupSano_ContratosCubrenLaSemana_GeneraSinErrores", async () => {
    // RECETA QUE FUNCIONA: 2 bloques/día L-V (10 franjas · 5h = 50h de demanda),
    // 2 trabajadores a 25h de contrato (5 franjas cada uno) disponibles todos
    // los días. La capacidad (50h) iguala la demanda, así que se cubre entera y
    // ambos cumplen sus condiciones de tipo.
    const ana: EmpleadoParaOptimizacion = {
      id: "ana",
      nombre: "Ana",
      disponibilidad: todoElDia(DIAS),
      condiciones: [{ tipo: "CIERRE", minimo: 2 }],
      horasContrato: 25,
    };
    const beto: EmpleadoParaOptimizacion = {
      id: "beto",
      nombre: "Beto",
      disponibilidad: todoElDia(DIAS),
      condiciones: [{ tipo: "APERTURA", minimo: 2 }],
      horasContrato: 25,
    };

    const { result, repo } = await generar(plantillaDosBloques(), [ana, beto]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.generado).toBe(true);
      expect(result.value.parcial).toBe(false);
      expect(result.value.condicionesIncumplidas).toEqual([]);
      expect(result.value.horasIncumplidas).toEqual([]);
      expect(result.value.huecos).toEqual([]);
    }
    expect(horasDe(repo, "ana")).toBe(25);
    expect(horasDe(repo, "beto")).toBe(25);
  });

  it("TopeContrato_SinHorasExtra_NoSuperaLasHorasDeContrato", async () => {
    // El motor nunca pasa del contrato sin horas extra, aunque el trabajador
    // esté disponible de sobra: Ana podría cubrir 50h pero su contrato es 20h.
    const ana: EmpleadoParaOptimizacion = {
      id: "ana",
      nombre: "Ana",
      disponibilidad: todoElDia(DIAS),
      condiciones: [],
      horasContrato: 20,
    };

    const { result, repo } = await generar(plantillaDosBloques(), [ana]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.parcial).toBe(false);
      // Quedan franjas sin cubrir porque el contrato la topa en 20h.
      expect(result.value.huecos.length).toBeGreaterThan(0);
    }
    expect(horasDe(repo, "ana")).toBe(20);
  });

  it("HorasExtra_ActivadasSubenElTopeHasta40YCubrenMas", async () => {
    // Mismo caso, pero con el interruptor de horas extra: el tope sube del
    // contrato (20h) al máximo legal (40h) y Ana absorbe más franjas.
    const ana: EmpleadoParaOptimizacion = {
      id: "ana",
      nombre: "Ana",
      disponibilidad: todoElDia(DIAS),
      condiciones: [],
      horasContrato: 20,
    };

    const { result, repo } = await generar(plantillaDosBloques(), [ana], true);

    expect(result.success).toBe(true);
    expect(horasDe(repo, "ana")).toBe(40);
    if (result.success) {
      // Con más horas asignadas quedan menos huecos que en el caso sin extra.
      const huecosExtra = result.value.huecos.reduce((s, h) => s + h.faltan, 0);
      expect(huecosExtra).toBeLessThan(10);
    }
  });

  it("DeficitHoras_DemandaInsuficienteParaElContrato_ReportaHorasQueFaltan", async () => {
    // Contrato de 20h pero el local solo ofrece una franja de 5h a la semana:
    // imposible llegar al contrato, se reportan las 15h que faltan.
    const plantillaMinima: BloqueRequerido[] = [
      {
        id: "LUNES_manana",
        nombre: "Mañana",
        diaSemana: "LUNES",
        horaInicio: "09:00",
        horaFin: "14:00",
        personasRequeridas: 1,
      },
    ];
    const ana: EmpleadoParaOptimizacion = {
      id: "ana",
      nombre: "Ana",
      disponibilidad: todoElDia(DIAS),
      condiciones: [],
      horasContrato: 20,
    };

    const { result } = await generar(plantillaMinima, [ana]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.parcial).toBe(true);
      expect(result.value.horasIncumplidas).toEqual([
        { usuarioNombre: "Ana", faltan: 15 },
      ]);
    }
  });

  it("RompeCubre_DisponibilidadNoContieneElBloque_CondicionImposible", async () => {
    // ROTURA #1 — la más común. La disponibilidad debe CONTENER por completo el
    // bloque (inicio_disp <= inicio_bloque y fin_disp >= fin_bloque). Cierre =
    // 16:00-21:00, pero Ana solo está disponible hasta las 20:00: NO cubre
    // ningún cierre, así que "CIERRE >= 2" es imposible.
    const ana: EmpleadoParaOptimizacion = {
      id: "ana",
      nombre: "Ana",
      disponibilidad: DIAS.map((dia) => ({
        diaSemana: dia,
        horaInicio: "08:00",
        horaFin: "20:00",
      })),
      condiciones: [{ tipo: "CIERRE", minimo: 2 }],
      horasContrato: 10,
    };

    const { result } = await generar(plantillaDosBloques(), [ana]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.parcial).toBe(true);
      expect(result.value.condicionesIncumplidas).toEqual([
        { usuarioNombre: "Ana", tipo: "CIERRE", faltan: 2 },
      ]);
    }
  });

  it("RompeMinimoAlto_MasTurnosQueDiasDisponibles_CondicionImposible", async () => {
    // ROTURA #2. Un mínimo por tipo es un conteo SEMANAL y no puede superar el
    // número de días con ese bloque en los que el trabajador está disponible.
    const ana: EmpleadoParaOptimizacion = {
      id: "ana",
      nombre: "Ana",
      disponibilidad: todoElDia(["LUNES", "MARTES"]),
      condiciones: [{ tipo: "CIERRE", minimo: 3 }],
      horasContrato: 10,
    };

    const { result } = await generar(plantillaDosBloques(), [ana]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.parcial).toBe(true);
      expect(result.value.condicionesIncumplidas).toEqual([
        { usuarioNombre: "Ana", tipo: "CIERRE", faltan: 1 }, // cubre 2 de 3
      ]);
    }
  });

  it("RompePartido_PlantillaConUnBloquePorDia_PartidoImposible", async () => {
    // ROTURA #3. Un turno PARTIDO exige DOS bloques el mismo día en la plantilla
    // y disponibilidad en ambos. Con un único bloque por día es imposible.
    const plantillaUnBloque: BloqueRequerido[] = DIAS.map((dia) => ({
      id: `${dia}_jornada`,
      nombre: "Jornada",
      diaSemana: dia,
      horaInicio: "09:00",
      horaFin: "17:00",
      personasRequeridas: 1,
    }));
    const ana: EmpleadoParaOptimizacion = {
      id: "ana",
      nombre: "Ana",
      disponibilidad: todoElDia(DIAS),
      condiciones: [{ tipo: "PARTIDO", minimo: 1 }],
      horasContrato: 8,
    };

    const { result } = await generar(plantillaUnBloque, [ana]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.parcial).toBe(true);
      expect(result.value.condicionesIncumplidas).toEqual([
        { usuarioNombre: "Ana", tipo: "PARTIDO", faltan: 1 },
      ]);
    }
  });

  it("PartidoSano_DosBloquesYDisponibleEnAmbos_CumplePartido", async () => {
    const ana: EmpleadoParaOptimizacion = {
      id: "ana",
      nombre: "Ana",
      disponibilidad: todoElDia(DIAS),
      condiciones: [{ tipo: "PARTIDO", minimo: 1 }],
      horasContrato: 10,
    };

    const { result } = await generar(plantillaDosBloques(), [ana]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.parcial).toBe(false);
      expect(result.value.condicionesIncumplidas).toEqual([]);
    }
  });
});
