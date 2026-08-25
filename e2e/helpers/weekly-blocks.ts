import { expect, type Page } from "@playwright/test";

/**
 * Añade un bloque (09:00–17:00 por defecto) en la columna de un día del editor
 * semanal y, opcionalmente, lo copia al resto de la semana.
 */
export async function anadirBloqueSemanal(
  page: Page,
  opciones: { dia?: string; copiarATodaLaSemana?: boolean } = {},
): Promise<void> {
  const dia = opciones.dia ?? "Lunes";
  const columna = page.locator("div").filter({
    has: page.getByRole("button", { name: "Añadir bloque" }),
  });
  // La columna del día es el contenedor que muestra su etiqueta.
  const columnaDia = columna.filter({ hasText: dia }).last();

  await columnaDia.getByRole("button", { name: "Añadir bloque" }).click();
  await page.getByRole("button", { name: "Añadir", exact: true }).click();
  await expect(page.getByText("Total semana: 8h")).toBeVisible();

  if (opciones.copiarATodaLaSemana) {
    await columnaDia.getByRole("button", { name: "Copiar día a otros días" }).click();
    await page.getByText("Toda la semana").click();
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByText("Total semana: 56h")).toBeVisible();
  }
}

/** Elige un valor en uno de los `Select` del design system (combobox + opción). */
export async function seleccionarOpcion(
  page: Page,
  campo: string,
  opcion: string,
): Promise<void> {
  await page.getByRole("combobox", { name: campo }).click();
  await page.getByRole("option", { name: opcion }).click();
}
