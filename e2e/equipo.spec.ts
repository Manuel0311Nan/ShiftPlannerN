import { expect, test } from "@playwright/test";
import {
  contarDisponibilidad,
  contarPlantilla,
  contarUsuariosPorEmail,
  emailE2E,
  localesDeManager,
  usuarioPorEmail,
} from "./helpers/db";
import { seedEmpresa } from "./helpers/factories";
import { login } from "./helpers/auth";
import {
  anadirBloqueSemanal,
  seleccionarOpcion,
} from "./helpers/weekly-blocks";

test.describe("Alta de personas en el equipo", () => {
  test("CrearManager_ConLocalYPlantilla_CreaCuentaLocalYBloques", async ({
    page,
  }) => {
    const semilla = await seedEmpresa({ etiqueta: "alta-manager" });
    const email = emailE2E("manager");

    await login(page, semilla.admin.email, semilla.admin.password);
    await page.goto("/dashboard/equipo?rol=MANAGER");
    await expect(page.getByRole("heading", { name: "Nuevo manager" })).toBeVisible();

    await page.getByLabel("Nombre", { exact: true }).fill("Marta Manager");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Nombre del local").fill("Local Nuevo");
    await anadirBloqueSemanal(page, { copiarATodaLaSemana: true });

    await page.getByRole("button", { name: "Crear cuenta" }).click();

    // Al crear un manager la app navega a su ficha.
    await page.waitForURL("**/dashboard/managers/**", { timeout: 45_000 });

    const creado = await usuarioPorEmail(email);
    expect(creado?.rol).toBe("MANAGER");
    expect(creado?.empresaId).toBe(semilla.empresaId);

    const locales = await localesDeManager(creado!.id);
    expect(locales).toHaveLength(1);
    expect(locales[0].nombre).toBe("Local Nuevo");
    expect(await contarPlantilla(locales[0].id)).toBe(7);
  });

  test("CrearTrabajador_ConDisponibilidad_QuedaAsignadoAlManagerYSuLocal", async ({
    page,
  }) => {
    const semilla = await seedEmpresa({ etiqueta: "alta-trabajador" });
    const email = emailE2E("trabajador");

    await login(page, semilla.admin.email, semilla.admin.password);
    await page.goto("/dashboard/equipo?rol=EMPLOYEE");
    await expect(
      page.getByRole("heading", { name: "Nuevo trabajador" }),
    ).toBeVisible();

    await page.getByLabel("Nombre", { exact: true }).fill("Tomás Trabajador");
    await page.getByLabel("Email").fill(email);
    await seleccionarOpcion(page, "Manager", semilla.admin.nombre);
    await page.getByLabel("Horas de contrato (semanales)").fill("30");
    await page.getByLabel("Días de libranza (por semana)").fill("2");
    await anadirBloqueSemanal(page, { copiarATodaLaSemana: true });

    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("Trabajador creado")).toBeVisible({
      timeout: 45_000,
    });

    const creado = await usuarioPorEmail(email);
    expect(creado?.rol).toBe("EMPLOYEE");
    expect(creado?.managerId).toBe(semilla.admin.id);
    expect(creado?.localId).toBe(semilla.localId);
    expect(creado?.horasContrato).toBe(30);
    expect(creado?.diasLibres).toBe(2);
    expect(await contarDisponibilidad(creado!.id)).toBe(7);
    // La contraseña temporal se guarda hasheada (formato "salt:clave").
    expect(creado?.passwordHash).toContain(":");
  });

  test("CrearTrabajador_EmailYaEnUso_MuestraErrorYNoDuplica", async ({ page }) => {
    const semilla = await seedEmpresa({
      etiqueta: "alta-duplicada",
      empleados: [{ nombre: "Ya Existe" }],
    });
    const emailExistente = semilla.empleados[0].email;

    await login(page, semilla.admin.email, semilla.admin.password);
    await page.goto("/dashboard/equipo?rol=EMPLOYEE");

    await page.getByLabel("Nombre", { exact: true }).fill("Repetido");
    await page.getByLabel("Email").fill(emailExistente);
    await seleccionarOpcion(page, "Manager", semilla.admin.nombre);
    await anadirBloqueSemanal(page);
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(page.getByText("Ya existe una cuenta con ese email")).toBeVisible({
      timeout: 45_000,
    });
    expect(await contarUsuariosPorEmail(emailExistente)).toBe(1);
  });

  test("Equipo_ListadoDeTrabajadores_MuestraLosDelaEmpresa", async ({ page }) => {
    const semilla = await seedEmpresa({
      etiqueta: "listado",
      empleados: [{ nombre: "Lucía Listada" }, { nombre: "Mario Listado" }],
    });

    await login(page, semilla.admin.email, semilla.admin.password);
    await page.goto("/dashboard/empleados");

    await expect(page.getByText("Lucía Listada")).toBeVisible();
    await expect(page.getByText("Mario Listado")).toBeVisible();
  });
});
