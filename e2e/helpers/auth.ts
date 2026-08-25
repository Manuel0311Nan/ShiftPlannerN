import { expect, type Page } from "@playwright/test";

/** Inicia sesión por la UI y espera a estar dentro del dashboard. */
export async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  // El login va contra Postgres remoto: margen amplio para la primera consulta.
  await page.waitForURL("**/dashboard", { timeout: 60_000 });
  await expect(page.getByRole("link", { name: "EonLab" }).first()).toBeVisible();
}

/** Cierra sesión desde el sidebar y espera la vuelta a la landing. */
export async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.waitForURL("**/");
}
