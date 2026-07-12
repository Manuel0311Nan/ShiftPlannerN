import { describe, expect, it } from "vitest";
import { UpdateLocalCommand } from "@/domains/shifts/application/update-local.command";
import { DeleteLocalCommand } from "@/domains/shifts/application/delete-local.command";
import type {
  LocalConManager,
  LocalRepository,
} from "@/domains/shifts/application/ports/local-repository.port";
import type { BloquePlantilla } from "@/domains/shifts/domain/bloque-plantilla";
import type { TurnoCommandContext } from "@/domains/scheduling/application/turno-authz";

class FakeLocalRepository implements LocalRepository {
  actualizados: { localId: string; nombre: string; plantilla: BloquePlantilla[] }[] = [];
  eliminados: string[] = [];

  constructor(private readonly locales: LocalConManager[]) {}

  async obtenerConManager(id: string): Promise<LocalConManager | null> {
    return this.locales.find((l) => l.id === id) ?? null;
  }

  async actualizarPlantilla(input: {
    localId: string;
    nombre: string;
    plantilla: BloquePlantilla[];
  }): Promise<void> {
    this.actualizados.push(input);
  }

  async eliminar(id: string): Promise<void> {
    this.eliminados.push(id);
  }
}

const ADMIN: TurnoCommandContext = { usuarioId: "admin-1", rol: "ADMIN" };
const MANAGER_A: TurnoCommandContext = { usuarioId: "mgr-a", rol: "MANAGER" };

const plantillaValida = [
  {
    diaSemana: "LUNES",
    nombre: "Mañana",
    horaInicio: "09:00",
    horaFin: "13:00",
    personasRequeridas: 2,
  },
];

function baseLocales(): LocalConManager[] {
  return [{ id: "local-a", nombre: "Centro", managerId: "mgr-a" }];
}

describe("UpdateLocalCommand", () => {
  it("UpdateLocalCommand_ManagerDelLocal_Persiste", async () => {
    const repo = new FakeLocalRepository(baseLocales());

    const result = await new UpdateLocalCommand(repo).execute(
      { localId: "local-a", nombre: "Centro Nuevo", plantilla: plantillaValida },
      MANAGER_A,
    );

    expect(result.success).toBe(true);
    expect(repo.actualizados[0]).toMatchObject({
      localId: "local-a",
      nombre: "Centro Nuevo",
    });
  });

  it("UpdateLocalCommand_ManagerAjeno_NoAutorizado", async () => {
    const repo = new FakeLocalRepository([
      { id: "local-a", nombre: "Centro", managerId: "otro-mgr" },
    ]);

    const result = await new UpdateLocalCommand(repo).execute(
      { localId: "local-a", nombre: "Centro", plantilla: plantillaValida },
      MANAGER_A,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("LOCAL_NO_AUTORIZADO");
    expect(repo.actualizados).toHaveLength(0);
  });

  it("UpdateLocalCommand_PlantillaVacia_DevuelveError", async () => {
    const repo = new FakeLocalRepository(baseLocales());

    const result = await new UpdateLocalCommand(repo).execute(
      { localId: "local-a", nombre: "Centro", plantilla: [] },
      ADMIN,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("LOCAL_PLANTILLA_VACIA");
  });

  it("UpdateLocalCommand_BloqueConHorasInvertidas_DevuelveError", async () => {
    const repo = new FakeLocalRepository(baseLocales());

    const result = await new UpdateLocalCommand(repo).execute(
      {
        localId: "local-a",
        nombre: "Centro",
        plantilla: [
          {
            diaSemana: "LUNES",
            nombre: "Turno",
            horaInicio: "18:00",
            horaFin: "13:00",
            personasRequeridas: 1,
          },
        ],
      },
      ADMIN,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("BLOQUE_RANGO_INVALIDO");
  });
});

describe("DeleteLocalCommand", () => {
  it("DeleteLocalCommand_ManagerDelLocal_Borra", async () => {
    const repo = new FakeLocalRepository(baseLocales());

    const result = await new DeleteLocalCommand(repo).execute(
      { localId: "local-a" },
      MANAGER_A,
    );

    expect(result.success).toBe(true);
    expect(repo.eliminados).toEqual(["local-a"]);
  });

  it("DeleteLocalCommand_LocalInexistente_DevuelveError", async () => {
    const repo = new FakeLocalRepository(baseLocales());

    const result = await new DeleteLocalCommand(repo).execute(
      { localId: "no-existe" },
      ADMIN,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("LOCAL_NO_ENCONTRADO");
  });
});
