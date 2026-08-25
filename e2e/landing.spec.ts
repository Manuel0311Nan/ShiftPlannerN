import { expect, test } from "@playwright/test";

test.describe("Landing pública", () => {
  test("Landing_UsuarioAnonimo_MuestraMarcaYLlamadasALaAccion", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/EonLab/);
    await expect(page.getByText("EonLab").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /El tiempo de tu equipo/i }),
    ).toBeVisible();
    await expect(page.getByText(/Prueba gratuita de 30 días/i)).toBeVisible();
    // La marca anterior no debe quedar en ningún sitio de la página.
    await expect(page.getByText(/Turnia/i)).toHaveCount(0);
  });

  test("Landing_ClicEmpezarGratis_LlevaAlRegistro", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Empezar gratis" }).first().click();

    await page.waitForURL("**/register");
    await expect(
      page.getByRole("heading", { name: "Crea tu empresa" }),
    ).toBeVisible();
  });

  test("Landing_ClicIniciarSesion_LlevaAlLogin", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Iniciar sesión" }).first().click();

    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Inicia sesión" })).toBeVisible();
  });
});
