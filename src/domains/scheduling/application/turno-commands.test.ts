import { describe, expect, it } from "vitest";
import type {
  EmpleadoConDisponibilidad,
  TurnoDetallado,
  TurnoEnSemana,
  TurnoRepository,
} from "@/domains/scheduling/application/ports/turno-repository.port";
import type { TurnoCommandContext } from "@/domains/scheduling/application/turno-authz";
import { MoveTurnoCommand } from "@/domains/scheduling/application/move-turno.command";
import { CreateTurnoCommand } from "@/domains/scheduling/application/create-turno.command";
import { UpdateTurnoCommand } from "@/domains/scheduling/application/update-turno.command";
import { DeleteTurnoCommand } from "@/domains/scheduling/application/delete-turno.command";

// Lunes 2026-01-05 — semana de referencia para todos los escenarios.
const d = (hhmm: string): Date => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2026, 0, 5, h, m, 0, 0);
};

type FakeData = {
  turnos: TurnoDetallado[];
  locales: { id: string; managerId: string }[];
  empleadosPorLocal: Record<string, EmpleadoConDisponibilidad[]>;
};

class FakeTurnoRepository implements TurnoRepository {
  creados: { usuarioId: string; inicio: Date; fin: Date }[] = [];
  movidos: { id: string; usuarioId: string; inicio: Date; fin: Date }[] = [];
  borrados: string[] = [];
  private seq = 0;

  constructor(private readonly data: FakeData) {}

  async buscarTurno(id: string): Promise<TurnoDetallado | null> {
    return this.data.turnos.find((t) => t.id === id) ?? null;
  }

  async buscarLocal(localId: string) {
    return this.data.locales.find((l) => l.id === localId) ?? null;
  }

  async empleadosDeLocal(localId: string): Promise<EmpleadoConDisponibilidad[]> {
    return this.data.empleadosPorLocal[localId] ?? [];
  }

  async turnosDeLocalEnSemana(localId: string): Promise<TurnoEnSemana[]> {
    return this.data.turnos
      .filter((t) => t.localId === localId)
      .map(({ id, usuarioId, inicio, fin }) => ({ id, usuarioId, inicio, fin }));
  }

  async crearTurno(input: {
    usuarioId: string;
    inicio: Date;
    fin: Date;
    metadata: Record<string, unknown>;
  }): Promise<{ id: string }> {
    this.creados.push({
      usuarioId: input.usuarioId,
      inicio: input.inicio,
      fin: input.fin,
    });
    return { id: `nuevo-${++this.seq}` };
  }

  async moverTurno(
    id: string,
    input: { inicio: Date; fin: Date; usuarioId: string },
  ): Promise<void> {
    this.movidos.push({ id, ...input });
  }

  async borrarTurno(id: string): Promise<void> {
    this.borrados.push(id);
  }
}

const ADMIN: TurnoCommandContext = { usuarioId: "admin-1", rol: "ADMIN" };
const MANAGER_LOCAL_A: TurnoCommandContext = { usuarioId: "mgr-a", rol: "MANAGER" };

const disponibilidadTodaLaSemana = [
  {
    diaSemana: "LUNES" as const,
    horaInicio: "00:00",
    horaFin: "23:59",
  },
];

function baseData(): FakeData {
  return {
    locales: [{ id: "local-a", managerId: "mgr-a" }],
    empleadosPorLocal: {
      "local-a": [
        { id: "emp-1", disponibilidad: disponibilidadTodaLaSemana },
        { id: "emp-2", disponibilidad: disponibilidadTodaLaSemana },
      ],
    },
    turnos: [
      {
        id: "turno-1",
        usuarioId: "emp-1",
        inicio: d("09:00"),
        fin: d("13:00"),
        metadata: { generado: true },
        localId: "local-a",
        managerId: "mgr-a",
      },
    ],
  };
}

describe("MoveTurnoCommand", () => {
  it("MoveTurnoCommand_SolapaConOtroTurno_DevuelveError", async () => {
    const data = baseData();
    data.turnos.push({
      id: "turno-2",
      usuarioId: "emp-1",
      inicio: d("14:00"),
      fin: d("18:00"),
      metadata: {},
      localId: "local-a",
      managerId: "mgr-a",
    });
    const repo = new FakeTurnoRepository(data);

    // Mover turno-1 a 12:00–16:00 pisa a turno-2 (14:00–18:00) del mismo empleado.
    const result = await new MoveTurnoCommand(repo).execute(
      { turnoId: "turno-1", inicio: d("12:00"), fin: d("16:00") },
      ADMIN,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("TURNO_SOLAPADO");
    expect(repo.movidos).toHaveLength(0);
  });

  it("MoveTurnoCommand_EmpleadoFueraDeLocal_DevuelveError", async () => {
    const repo = new FakeTurnoRepository(baseData());

    const result = await new MoveTurnoCommand(repo).execute(
      {
        turnoId: "turno-1",
        inicio: d("09:00"),
        fin: d("13:00"),
        usuarioId: "emp-externo",
      },
      ADMIN,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("EMPLEADO_FUERA_DE_LOCAL");
  });

  it("MoveTurnoCommand_FueraDeDisponibilidad_DevuelveAdvertencia", async () => {
    const data = baseData();
    data.empleadosPorLocal["local-a"][0].disponibilidad = [
      { diaSemana: "LUNES", horaInicio: "09:00", horaFin: "13:00" },
    ];
    const repo = new FakeTurnoRepository(data);

    // Nueva franja 18:00–20:00 queda fuera de la disponibilidad (09–13).
    const result = await new MoveTurnoCommand(repo).execute(
      { turnoId: "turno-1", inicio: d("18:00"), fin: d("20:00") },
      ADMIN,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.advertencias).toHaveLength(1);
    }
    expect(repo.movidos).toHaveLength(1);
  });

  it("MoveTurnoCommand_ManagerDeOtroLocal_NoAutorizado", async () => {
    const data = baseData();
    // El turno pertenece a un local cuyo manager es "otro-mgr".
    data.turnos[0].managerId = "otro-mgr";
    const repo = new FakeTurnoRepository(data);

    const result = await new MoveTurnoCommand(repo).execute(
      { turnoId: "turno-1", inicio: d("09:00"), fin: d("12:00") },
      MANAGER_LOCAL_A,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("NO_AUTORIZADO");
  });

  it("MoveTurnoCommand_ReasignaAEmpleadoDelLocal_Persiste", async () => {
    const repo = new FakeTurnoRepository(baseData());

    const result = await new MoveTurnoCommand(repo).execute(
      {
        turnoId: "turno-1",
        inicio: d("09:00"),
        fin: d("13:00"),
        usuarioId: "emp-2",
      },
      MANAGER_LOCAL_A,
    );

    expect(result.success).toBe(true);
    expect(repo.movidos[0]).toMatchObject({ id: "turno-1", usuarioId: "emp-2" });
  });
});

describe("CreateTurnoCommand", () => {
  it("CreateTurnoCommand_HorasInvertidas_DevuelveError", async () => {
    const repo = new FakeTurnoRepository(baseData());

    const result = await new CreateTurnoCommand(repo).execute(
      {
        localId: "local-a",
        usuarioId: "emp-1",
        inicio: d("18:00"),
        fin: d("14:00"),
      },
      ADMIN,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("HORAS_INVERTIDAS");
    expect(repo.creados).toHaveLength(0);
  });

  it("CreateTurnoCommand_Valido_MarcaOrigenManual", async () => {
    const repo = new FakeTurnoRepository(baseData());

    const result = await new CreateTurnoCommand(repo).execute(
      {
        localId: "local-a",
        usuarioId: "emp-2",
        inicio: d("15:00"),
        fin: d("19:00"),
      },
      MANAGER_LOCAL_A,
    );

    expect(result.success).toBe(true);
    expect(repo.creados).toHaveLength(1);
  });
});

describe("UpdateTurnoCommand", () => {
  it("UpdateTurnoCommand_MismoEmpleadoNuevaFranja_Persiste", async () => {
    const repo = new FakeTurnoRepository(baseData());

    const result = await new UpdateTurnoCommand(repo).execute(
      { turnoId: "turno-1", inicio: d("10:00"), fin: d("14:00") },
      MANAGER_LOCAL_A,
    );

    expect(result.success).toBe(true);
    expect(repo.movidos[0]).toMatchObject({ id: "turno-1", usuarioId: "emp-1" });
  });
});

describe("DeleteTurnoCommand", () => {
  it("DeleteTurnoCommand_ManagerDelLocal_Borra", async () => {
    const repo = new FakeTurnoRepository(baseData());

    const result = await new DeleteTurnoCommand(repo).execute(
      { turnoId: "turno-1" },
      MANAGER_LOCAL_A,
    );

    expect(result.success).toBe(true);
    expect(repo.borrados).toEqual(["turno-1"]);
  });

  it("DeleteTurnoCommand_TurnoInexistente_DevuelveError", async () => {
    const repo = new FakeTurnoRepository(baseData());

    const result = await new DeleteTurnoCommand(repo).execute(
      { turnoId: "no-existe" },
      ADMIN,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("TURNO_NO_ENCONTRADO");
  });
});
