import { describe, expect, it } from "vitest";
import {
  GenerateScheduleCommand,
  type GenerateScheduleContext,
} from "@/domains/scheduling/application/generate-schedule.command";
import type {
  EmpleadoParaOptimizacion,
  GenerateScheduleRepository,
} from "@/domains/scheduling/application/ports/generate-schedule-repository.port";
import type { BloqueRequerido, Empleado } from "@/domains/scheduling/domain/generar-asignaciones";
import { YalpsScheduleSolver } from "@/domains/scheduling/infrastructure/yalps-solver";

const DIAS = ["LUNES", "MARTES", "MIERCOLES"] as const;

function semana(): BloqueRequerido[] {
  const bloques: BloqueRequerido[] = [];
  for (const dia of DIAS) {
    bloques.push({ id: `${dia}_m`, nombre: "Mañana", diaSemana: dia, horaInicio: "09:00", horaFin: "14:00", personasRequeridas: 1 });
    bloques.push({ id: `${dia}_t`, nombre: "Tarde", diaSemana: dia, horaInicio: "16:00", horaFin: "21:00", personasRequeridas: 1 });
  }
  return bloques;
}

class FakeRepo implements GenerateScheduleRepository {
  borradoLlamado = false;
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
  async borrarTurnosGenerados() {
    this.borradoLlamado = true;
  }
  async crearTurnos(turnos: { usuarioId: string; inicio: Date; fin: Date }[]) {
    this.turnosCreados = turnos;
  }
}

const ADMIN: GenerateScheduleContext = { invitadoPorId: "admin", invitadoPorRol: "ADMIN" };
const input = { localId: "local-1", semanaInicio: new Date(2026, 0, 5) };

describe("GenerateScheduleCommand (motor ILP)", () => {
  it("execute_CondicionesFactibles_GeneraYPersiste", async () => {
    const ana: EmpleadoParaOptimizacion = {
      id: "ana",
      nombre: "Ana",
      disponibilidad: DIAS.map((dia) => ({ diaSemana: dia, horaInicio: "00:00", horaFin: "23:59" })),
      condiciones: [{ tipo: "CIERRE", minimo: 2 }],
    };
    const repo = new FakeRepo(semana(), [ana]);

    const result = await new GenerateScheduleCommand(repo, new YalpsScheduleSolver()).execute(input, ADMIN);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.generado).toBe(true);
      expect(result.value.condicionesIncumplidas).toEqual([]);
    }
    expect(repo.borradoLlamado).toBe(true);
    expect(repo.turnosCreados.length).toBeGreaterThan(0);
  });

  it("execute_CondicionImposible_PrecargaLoPosibleYReportaIncumplidas", async () => {
    // Beto solo está disponible por la mañana, así que puede cubrir aperturas
    // pero nunca los 2 cierres exigidos: se genera lo posible (precarga) y se
    // reporta el déficit de cierres para completarlo a mano.
    const beto: EmpleadoParaOptimizacion = {
      id: "beto",
      nombre: "Beto",
      disponibilidad: DIAS.map((dia) => ({ diaSemana: dia, horaInicio: "08:00", horaFin: "15:00" })),
      condiciones: [{ tipo: "CIERRE", minimo: 2 }],
    };
    const repo = new FakeRepo(semana(), [beto]);

    const result = await new GenerateScheduleCommand(repo, new YalpsScheduleSolver()).execute(input, ADMIN);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.parcial).toBe(true);
      expect(result.value.generado).toBe(true);
      expect(result.value.turnosCreados).toBeGreaterThan(0);
      expect(result.value.condicionesIncumplidas).toEqual([
        { usuarioNombre: "Beto", tipo: "CIERRE", faltan: 2 },
      ]);
    }
    expect(repo.borradoLlamado).toBe(true);
    expect(repo.turnosCreados.length).toBeGreaterThan(0);
  });

  it("execute_ManagerDeOtroLocal_NoAutorizado", async () => {
    const repo = new FakeRepo(semana(), []);
    const result = await new GenerateScheduleCommand(repo, new YalpsScheduleSolver()).execute(input, {
      invitadoPorId: "otro-mgr",
      invitadoPorRol: "MANAGER",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("LOCAL_NO_AUTORIZADO");
  });
});
