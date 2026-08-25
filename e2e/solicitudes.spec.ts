import { expect, test } from "@playwright/test";
import {
  contarSolicitudes,
  crearSolicitud,
  solicitudesDeUsuario,
} from "./helpers/db";
import { formatoFecha, lunesDeLaSemana, seedEmpresa } from "./helpers/factories";
import { login } from "./helpers/auth";

/** Semana válida para solicitar: 15 días de antelación mínima + margen. */
function semanaSolicitable(): Date {
  const lunes = lunesDeLaSemana();
  lunes.setDate(lunes.getDate() + 28);
  return lunes;
}

test.describe("Solicitudes de cambio de disponibilidad", () => {
  test("CrearSolicitud_ConAntelacionSuficiente_QuedaPendienteParaElManager", async ({
    page,
  }) => {
    const semilla = await seedEmpresa({
      etiqueta: "solicitud",
      empleados: [{ nombre: "Sara Solicitante" }],
    });
    const empleado = semilla.empleados[0];
    const semana = formatoFecha(semanaSolicitable());

    await login(page, empleado.email, empleado.password);
    await page.goto("/dashboard/solicitudes");

    await page.getByLabel("Semana afectada").fill(semana);
    await page.getByLabel("Motivo").fill("Tengo un examen esa semana");
    await page.getByRole("button", { name: "Enviar solicitud" }).click();

    await expect(page.getByText("Solicitud enviada")).toBeVisible({
      timeout: 30_000,
    });

    const solicitudes = await solicitudesDeUsuario(empleado.id);
    expect(solicitudes).toHaveLength(1);
    expect(solicitudes[0].estado).toBe("PENDIENTE");
    expect(solicitudes[0].motivo).toBe("Tengo un examen esa semana");
  });

  test("CrearSolicitud_SinAntelacionSuficiente_EsRechazada", async ({ page }) => {
    const semilla = await seedEmpresa({
      etiqueta: "solicitud-tarde",
      empleados: [{ nombre: "Pedro Impaciente" }],
    });
    const empleado = semilla.empleados[0];
    // La semana actual incumple los 15 días de antelación.
    const semana = formatoFecha(lunesDeLaSemana());

    await login(page, empleado.email, empleado.password);
    await page.goto("/dashboard/solicitudes");

    // El input tiene `min`, así que se rellena saltándose la validación nativa
    // del navegador para comprobar que el servidor también la aplica.
    await page.getByLabel("Semana afectada").evaluate((input, valor) => {
      const campo = input as HTMLInputElement;
      campo.removeAttribute("min");
      campo.value = valor;
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    }, semana);
    await page.getByLabel("Motivo").fill("Es para ya");
    await page.getByRole("button", { name: "Enviar solicitud" }).click();

    await expect(page.getByText(/antelación/i).last()).toBeVisible({
      timeout: 30_000,
    });
    expect(await contarSolicitudes(empleado.id)).toBe(0);
  });

  test("ResolverSolicitud_ManagerRechaza_QuedaRechazadaYQuedaRegistrada", async ({
    page,
  }) => {
    const semilla = await seedEmpresa({
      etiqueta: "resolver",
      empleados: [{ nombre: "Rita Resuelta" }],
    });
    const empleado = semilla.empleados[0];

    await crearSolicitud({
      empresaId: semilla.empresaId,
      usuarioId: empleado.id,
      semanaInicio: semanaSolicitable(),
      motivo: "Viaje familiar",
    });

    await login(page, semilla.admin.email, semilla.admin.password);
    await page.goto("/dashboard/solicitudes");
    await expect(page.getByText("Viaje familiar")).toBeVisible();

    await page.getByRole("button", { name: "Rechazar" }).click();
    await page
      .getByLabel("Respuesta al trabajador (opcional)")
      .fill("Esa semana no hay relevo");
    await page.getByRole("button", { name: "Confirmar rechazo" }).click();

    await expect(page.getByText("No hay solicitudes pendientes")).toBeVisible({
      timeout: 30_000,
    });

    const solicitudes = await solicitudesDeUsuario(empleado.id);
    expect(solicitudes[0].estado).toBe("RECHAZADA");
    expect(solicitudes[0].respuesta).toBe("Esa semana no hay relevo");
    expect(solicitudes[0].resueltaPorId).toBe(semilla.admin.id);
  });
});
