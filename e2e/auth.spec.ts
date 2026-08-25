import { expect, test } from "@playwright/test";
import {
  E2E_PREFIJO,
  contarEmpresasPorNombre,
  emailE2E,
  empresaPorNombre,
  idUnico,
  usuariosDeEmpresa,
} from "./helpers/db";
import { PASSWORD_E2E, seedEmpresa } from "./helpers/factories";
import { login, logout } from "./helpers/auth";

test.describe("Registro e inicio de sesión", () => {
  test("Registro_DatosValidos_CreaEmpresaConTrialYEntraAlDashboard", async ({
    page,
  }) => {
    const empresaNombre = `${E2E_PREFIJO}registro-${idUnico().slice(0, 8)}`;
    const email = emailE2E("registro");

    await page.goto("/register");
    await page.getByLabel("Nombre de la empresa").fill(empresaNombre);
    await page.getByLabel("Tu nombre").fill("Admin Registro");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(PASSWORD_E2E);
    await page.getByRole("button", { name: "Empezar prueba gratis" }).click();

    // El registro autentica y redirige: la sesión debe quedar iniciada.
    await page.waitForURL("**/dashboard", { timeout: 45_000 });
    await expect(page.getByText("Administrador")).toBeVisible();

    const empresa = await empresaPorNombre(empresaNombre);
    expect(empresa).not.toBeNull();

    const usuarios = await usuariosDeEmpresa(empresa!.id);
    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].rol).toBe("ADMIN");
    // La contraseña nunca se guarda en claro.
    expect(usuarios[0].passwordHash).not.toContain(PASSWORD_E2E);

    // Trial de 30 días.
    const dias = Math.round(
      (new Date(empresa!.trialEndsAt).getTime() - Date.now()) / 86_400_000,
    );
    expect(dias).toBeGreaterThanOrEqual(29);
    expect(dias).toBeLessThanOrEqual(30);
  });

  test("Registro_EmailYaRegistrado_MuestraErrorYNoDuplicaEmpresa", async ({
    page,
  }) => {
    const semilla = await seedEmpresa({ etiqueta: "dup" });
    const empresaNombre = `${E2E_PREFIJO}dup-intento-${idUnico().slice(0, 8)}`;

    await page.goto("/register");
    await page.getByLabel("Nombre de la empresa").fill(empresaNombre);
    await page.getByLabel("Tu nombre").fill("Otro Admin");
    await page.getByLabel("Email").fill(semilla.admin.email);
    await page.getByLabel("Contraseña").fill(PASSWORD_E2E);
    await page.getByRole("button", { name: "Empezar prueba gratis" }).click();

    await expect(page.getByText("Ya existe una cuenta con ese email")).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
    expect(await contarEmpresasPorNombre(empresaNombre)).toBe(0);
  });

  test("Login_CredencialesIncorrectas_MuestraErrorYNoCreaSesion", async ({
    page,
  }) => {
    const semilla = await seedEmpresa({ etiqueta: "login-ko" });

    await page.goto("/login");
    await page.getByLabel("Email").fill(semilla.admin.email);
    await page.getByLabel("Contraseña").fill("password-incorrecta");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByText("Email o contraseña incorrectos")).toBeVisible();
    await page.goto("/dashboard");
    await page.waitForURL("**/login**");
  });

  test("Login_CredencialesValidas_EntraYCierraSesion", async ({ page }) => {
    const semilla = await seedEmpresa({ etiqueta: "login-ok" });

    await login(page, semilla.admin.email, semilla.admin.password);
    await expect(page.getByText(semilla.admin.nombre).first()).toBeVisible();

    await logout(page);
    await page.goto("/dashboard");
    await page.waitForURL("**/login**");
  });

  test("Dashboard_SinSesion_RedirigeALogin", async ({ page }) => {
    await page.goto("/dashboard/horarios");
    await page.waitForURL("**/login**");
    await expect(page.getByRole("heading", { name: "Inicia sesión" })).toBeVisible();
  });
});
