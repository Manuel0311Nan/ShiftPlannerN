import { expect, test } from "@playwright/test";
import { crearTurno } from "./helpers/db";
import { seedEmpresa } from "./helpers/factories";
import { login } from "./helpers/auth";

test.describe("Permisos y aislamiento entre empresas", () => {
  test("Managers_EmpleadoIntentaEntrar_EsRedirigidoAlPanel", async ({ page }) => {
    const semilla = await seedEmpresa({
      etiqueta: "permisos",
      empleados: [{ nombre: "Eva Empleada" }],
    });
    const empleado = semilla.empleados[0];

    await login(page, empleado.email, empleado.password);
    await page.goto("/dashboard/managers");

    await page.waitForURL("**/dashboard");
    // Y el menú lateral tampoco le ofrece secciones de administración.
    await expect(page.getByRole("link", { name: "Managers" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Equipo" })).toHaveCount(0);
  });

  test("Empleado_MenuLateral_SoloVeSusSecciones", async ({ page }) => {
    const semilla = await seedEmpresa({
      etiqueta: "menu-empleado",
      empleados: [{ nombre: "Nora Navegante" }],
    });
    const empleado = semilla.empleados[0];

    await login(page, empleado.email, empleado.password);

    await expect(page.getByRole("link", { name: "Horarios" }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Solicitudes" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Plan" })).toHaveCount(0);
  });

  test("Empleados_AdminDeOtraEmpresa_NoVeAlPersonalAjeno", async ({ page }) => {
    const propia = await seedEmpresa({
      etiqueta: "tenant-a",
      empleados: [{ nombre: "Propio Dela Casa" }],
    });
    const ajena = await seedEmpresa({
      etiqueta: "tenant-b",
      empleados: [{ nombre: "Ajeno Dela Otra" }],
    });

    await login(page, propia.admin.email, propia.admin.password);
    await page.goto("/dashboard/empleados");

    await expect(page.getByText("Propio Dela Casa")).toBeVisible();
    await expect(page.getByText("Ajeno Dela Otra")).toHaveCount(0);

    // Ni siquiera accediendo por URL directa a la ficha del ajeno.
    await page.goto(`/dashboard/empleados/${ajena.empleados[0].id}`);
    await expect(page.getByText("Ajeno Dela Otra")).toHaveCount(0);
  });

  test("Horarios_TurnosDeOtraEmpresa_NoSeMezclan", async ({ page }) => {
    const propia = await seedEmpresa({
      etiqueta: "turnos-a",
      empleados: [{ nombre: "Alfa Propio" }],
    });
    const ajena = await seedEmpresa({
      etiqueta: "turnos-b",
      empleados: [{ nombre: "Beta Ajena" }],
    });

    const inicio = new Date();
    inicio.setHours(9, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setHours(17, 0, 0, 0);
    await crearTurno({
      empresaId: ajena.empresaId,
      usuarioId: ajena.empleados[0].id,
      inicio,
      fin,
    });

    await login(page, propia.admin.email, propia.admin.password);
    await page.goto("/dashboard/horarios");

    await expect(page.getByText("Beta Ajena")).toHaveCount(0);
  });
});
