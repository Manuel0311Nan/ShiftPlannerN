import { describe, expect, it } from "vitest";
import { UpdateUserCommand } from "@/domains/identity/application/update-user.command";
import { DeleteUserCommand } from "@/domains/identity/application/delete-user.command";
import type {
  UpdateUserRepository,
  UsuarioEditable,
} from "@/domains/identity/application/ports/update-user-repository.port";
import type { EmailSender } from "@/domains/identity/application/ports/email-sender.port";

type FakeData = {
  usuarios: UsuarioEditable[];
  emailsGlobales: string[];
  localesPorManager: Record<string, { id: string }[]>;
};

class FakeUpdateUserRepository implements UpdateUserRepository {
  actualizados: { id: string; email: string; managerId: string | null; localId: string | null }[] = [];
  eliminados: string[] = [];

  constructor(private readonly data: FakeData) {}

  async obtener(id: string): Promise<UsuarioEditable | null> {
    return this.data.usuarios.find((u) => u.id === id) ?? null;
  }

  async emailEnUsoPorOtro(email: string, exceptoId: string): Promise<boolean> {
    const propio = this.data.usuarios.find((u) => u.id === exceptoId);
    return this.data.emailsGlobales.some(
      (e) => e === email && e !== propio?.email,
    );
  }

  async localesDeManager(managerId: string): Promise<{ id: string }[]> {
    return this.data.localesPorManager[managerId] ?? [];
  }

  async actualizar(input: {
    id: string;
    nombre: string;
    email: string;
    managerId: string | null;
    localId: string | null;
  }): Promise<void> {
    this.actualizados.push({
      id: input.id,
      email: input.email,
      managerId: input.managerId,
      localId: input.localId,
    });
  }

  async eliminar(id: string): Promise<void> {
    this.eliminados.push(id);
  }
}

class FakeEmailSender implements EmailSender {
  cambiosNotificados: string[] = [];
  async enviarCredenciales(): Promise<void> {}
  async notificarCambioEmail(input: { to: string }): Promise<void> {
    this.cambiosNotificados.push(input.to);
  }
}

const CTX_ADMIN = { empresaNombre: "Acme", editorId: "admin-1", editorRol: "ADMIN" as const };
const CTX_MANAGER = { empresaNombre: "Acme", editorId: "mgr-a", editorRol: "MANAGER" as const };

const disponibilidad = [{ diaSemana: "LUNES", horaInicio: "09:00", horaFin: "17:00" }];

function baseData(): FakeData {
  return {
    usuarios: [
      {
        id: "emp-1",
        email: "emp1@acme.com",
        nombre: "Empleado Uno",
        rol: "EMPLOYEE",
        managerId: "mgr-a",
        localId: "local-a",
      },
      {
        id: "emp-otro",
        email: "otro@acme.com",
        nombre: "Empleado Otro",
        rol: "EMPLOYEE",
        managerId: "mgr-b",
        localId: "local-b",
      },
      {
        id: "mgr-a",
        email: "mgra@acme.com",
        nombre: "Manager A",
        rol: "MANAGER",
        managerId: null,
        localId: null,
      },
    ],
    emailsGlobales: ["emp1@acme.com", "otro@acme.com", "mgra@acme.com"],
    localesPorManager: { "mgr-a": [{ id: "local-a" }] },
  };
}

describe("UpdateUserCommand", () => {
  it("UpdateUserCommand_EmployeeEditaSuManager_Persiste", async () => {
    const repo = new FakeUpdateUserRepository(baseData());
    const email = new FakeEmailSender();

    const result = await new UpdateUserCommand(repo, email).execute(
      {
        usuarioId: "emp-1",
        nombre: "Empleado Renombrado",
        email: "emp1@acme.com",
        disponibilidad,
      },
      CTX_MANAGER,
    );

    expect(result.success).toBe(true);
    expect(repo.actualizados).toHaveLength(1);
    expect(email.cambiosNotificados).toHaveLength(0);
  });

  it("UpdateUserCommand_ManagerEditaEmpleadoAjeno_NoAutorizado", async () => {
    const repo = new FakeUpdateUserRepository(baseData());

    const result = await new UpdateUserCommand(repo, new FakeEmailSender()).execute(
      {
        usuarioId: "emp-otro",
        nombre: "Nombre",
        email: "otro@acme.com",
        disponibilidad,
      },
      CTX_MANAGER,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("EDIT_NO_AUTORIZADO");
    expect(repo.actualizados).toHaveLength(0);
  });

  it("UpdateUserCommand_EmpleadoEditor_NoPermitido", async () => {
    const repo = new FakeUpdateUserRepository(baseData());

    const result = await new UpdateUserCommand(repo, new FakeEmailSender()).execute(
      { usuarioId: "emp-1", nombre: "X", email: "emp1@acme.com", disponibilidad },
      { empresaNombre: "Acme", editorId: "emp-1", editorRol: "EMPLOYEE" },
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("EDIT_ROL_NO_PERMITIDO");
  });

  it("UpdateUserCommand_EmailDuplicadoDeOtro_DevuelveError", async () => {
    const repo = new FakeUpdateUserRepository(baseData());

    const result = await new UpdateUserCommand(repo, new FakeEmailSender()).execute(
      {
        usuarioId: "emp-1",
        nombre: "Empleado Uno",
        email: "mgra@acme.com",
        disponibilidad,
      },
      CTX_ADMIN,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("EDIT_EMAIL_DUPLICADO");
  });

  it("UpdateUserCommand_CambiaEmail_NotificaAlUsuario", async () => {
    const repo = new FakeUpdateUserRepository(baseData());
    const email = new FakeEmailSender();

    const result = await new UpdateUserCommand(repo, email).execute(
      {
        usuarioId: "emp-1",
        nombre: "Empleado Uno",
        email: "nuevo@acme.com",
        disponibilidad,
      },
      CTX_ADMIN,
    );

    expect(result.success).toBe(true);
    expect(email.cambiosNotificados).toEqual(["nuevo@acme.com"]);
  });

  it("UpdateUserCommand_DisponibilidadVacia_DevuelveError", async () => {
    const repo = new FakeUpdateUserRepository(baseData());

    const result = await new UpdateUserCommand(repo, new FakeEmailSender()).execute(
      { usuarioId: "emp-1", nombre: "Empleado Uno", email: "emp1@acme.com", disponibilidad: [] },
      CTX_MANAGER,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("EDIT_DISPONIBILIDAD_VACIA");
  });
});

describe("DeleteUserCommand", () => {
  it("DeleteUserCommand_ManagerBorraSuEmpleado_Borra", async () => {
    const repo = new FakeUpdateUserRepository(baseData());

    const result = await new DeleteUserCommand(repo).execute(
      { usuarioId: "emp-1" },
      CTX_MANAGER,
    );

    expect(result.success).toBe(true);
    expect(repo.eliminados).toEqual(["emp-1"]);
  });

  it("DeleteUserCommand_BorrarsePropiaCuenta_DevuelveError", async () => {
    const repo = new FakeUpdateUserRepository(baseData());

    const result = await new DeleteUserCommand(repo).execute(
      { usuarioId: "mgr-a" },
      CTX_MANAGER,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("DELETE_PROPIA_CUENTA");
    expect(repo.eliminados).toHaveLength(0);
  });

  it("DeleteUserCommand_ManagerBorraEmpleadoAjeno_NoAutorizado", async () => {
    const repo = new FakeUpdateUserRepository(baseData());

    const result = await new DeleteUserCommand(repo).execute(
      { usuarioId: "emp-otro" },
      CTX_MANAGER,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("DELETE_NO_AUTORIZADO");
  });
});
