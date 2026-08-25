import { expect, test } from "@playwright/test";
import { contarTurnos, crearTurno, turnosDeEmpresa } from "./helpers/db";
import { formatoFecha, lunesDeLaSemana, seedEmpresa } from "./helpers/factories";
import { login } from "./helpers/auth";

/** Lunes de la semana siguiente: evita chocar con turnos ya pasados. */
function proximoLunes(): Date {
  const lunes = lunesDeLaSemana();
  lunes.setDate(lunes.getDate() + 7);
  return lunes;
}

test.describe("Generación de horarios", () => {
  test("GenerarHorario_UnEmpleadoQueCubreLaPlantilla_CreaCincoTurnos", async ({
    page,
  }) => {
    // 5 bloques de 8h (lun–vie) y una empleada de 40h con 2 días libres:
    // el reparto encaja exacto, así que el horario debe salir completo.
    const semilla = await seedEmpresa({
      etiqueta: "generar",
      empleados: [{ nombre: "Ana Cobertura", horasContrato: 40, diasLibres: 2 }],
    });
    const semana = formatoFecha(proximoLunes());

    await login(page, semilla.admin.email, semilla.admin.password);
    await page.goto(`/dashboard/horarios?semana=${semana}`);

    await page.getByLabel("Semana (lunes)").fill(semana);
    await page.getByRole("button", { name: "Generar horario" }).click();

    await expect(page.getByText(/5 turnos generados/)).toBeVisible({
      timeout: 60_000,
    });

    const turnos = await turnosDeEmpresa(semilla.empresaId);
    expect(turnos).toHaveLength(5);
    expect(turnos.every((t) => t.usuarioId === semilla.empleados[0].id)).toBe(true);
    // Cada turno cubre el bloque de 8h de la plantilla.
    for (const turno of turnos) {
      const horas =
        (new Date(turno.fin).getTime() - new Date(turno.inicio).getTime()) / 3_600_000;
      expect(horas).toBe(8);
    }

    // El tablero de la semana muestra a la empleada asignada.
    await expect(page.getByText("Ana Cobertura").first()).toBeVisible();
  });

  test("GenerarHorario_SinCapacidadSuficiente_AvisaDeHuecos", async ({ page }) => {
    // Una sola empleada con 4 días libres solo puede trabajar 3 de los 5 días.
    const semilla = await seedEmpresa({
      etiqueta: "huecos",
      empleados: [{ nombre: "Bea Limitada", horasContrato: 24, diasLibres: 4 }],
    });
    const semana = formatoFecha(proximoLunes());

    await login(page, semilla.admin.email, semilla.admin.password);
    await page.goto(`/dashboard/horarios?semana=${semana}`);
    await page.getByLabel("Semana (lunes)").fill(semana);
    await page.getByRole("button", { name: "Generar horario" }).click();

    await expect(page.getByText(/Faltó cobertura en/)).toBeVisible({
      timeout: 60_000,
    });

    // Coloca lo que puede (3 días) sin romper el tope de días trabajados.
    expect(await contarTurnos(semilla.empresaId)).toBe(3);
  });

  test("GenerarHorario_RegenerarLaMismaSemana_NoDuplicaTurnos", async ({ page }) => {
    const semilla = await seedEmpresa({
      etiqueta: "regenerar",
      empleados: [{ nombre: "Carla Repetida", horasContrato: 40, diasLibres: 2 }],
    });
    const semana = formatoFecha(proximoLunes());

    await login(page, semilla.admin.email, semilla.admin.password);
    await page.goto(`/dashboard/horarios?semana=${semana}`);
    await page.getByLabel("Semana (lunes)").fill(semana);

    for (let intento = 0; intento < 2; intento++) {
      await page.getByRole("button", { name: "Generar horario" }).click();
      await expect(page.getByText(/5 turnos generados/)).toBeVisible({
        timeout: 60_000,
      });
    }

    expect(await contarTurnos(semilla.empresaId)).toBe(5);
  });

  test("Horarios_VistaDeEmpleado_VeSusTurnosSinPoderGenerar", async ({ page }) => {
    const semilla = await seedEmpresa({
      etiqueta: "vista-empleado",
      empleados: [{ nombre: "Diana Solo Lectura", horasContrato: 40, diasLibres: 2 }],
    });
    const lunes = proximoLunes();
    const semana = formatoFecha(lunes);

    // Turno creado directamente: este test comprueba la vista, no el motor.
    const inicio = new Date(lunes);
    inicio.setHours(9, 0, 0, 0);
    const fin = new Date(lunes);
    fin.setHours(17, 0, 0, 0);
    await crearTurno({
      empresaId: semilla.empresaId,
      usuarioId: semilla.empleados[0].id,
      inicio,
      fin,
    });

    const empleado = semilla.empleados[0];
    await login(page, empleado.email, empleado.password);
    await page.goto(`/dashboard/horarios?semana=${semana}`);

    await expect(page.getByText("09:00").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Generar horario" })).toHaveCount(0);
  });
});
