import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// `.env.test` manda sobre `.env`: permite apuntar los e2e a una rama de Neon
// distinta de la de desarrollo sin tocar el resto del proyecto.
loadEnv({ path: ".env.test", override: true, quiet: true });
loadEnv({ path: ".env", quiet: true });

// E2E_DEV=1 arranca `next dev` (iteración rápida); por defecto se compila y se
// sirve el build de producción, que es lo que corre en Vercel.
const usarDev = process.env.E2E_DEV === "1";

// Next 16 solo admite un `next dev` por directorio de proyecto: un segundo
// arranca, imprime "Ready" y muere al detectar al primero, así que Playwright
// da por buena la URL y luego falla con ERR_CONNECTION_REFUSED. Por eso en modo
// dev se apunta al puerto del dev server habitual (3000) y se reutiliza el que
// ya esté levantado; el build de producción sí convive con él, en otro puerto.
const PORT = Number(process.env.E2E_PORT ?? (usarDev ? 3000 : 3100));
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Por defecto cada ejecución arranca (y mata) su propio servidor. Reutilizar
// uno ajeno era la causa de los `ERR_CONNECTION_REFUSED` en cascada: Playwright
// adopta el proceso que ya escucha en el puerto pero no lo controla, así que si
// es un huérfano de una pasada anterior y muere a media suite, todos los tests
// que quedan fallan contra un puerto muerto. E2E_REUSE=1 recupera el atajo para
// iterar contra un servidor levantado a mano.
const reutilizarServidor = process.env.E2E_REUSE === "1";

export default defineConfig({
  testDir: "./e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  // El motor de horarios y los Server Actions van contra Postgres remoto:
  // márgenes amplios para no confundir latencia con fallo.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Un reintento en local absorbe la latencia puntual de la base de datos
  // remota; en CI se permite uno más.
  retries: process.env.CI ? 2 : 1,
  // Los tests comparten base de datos (cada uno con su propia empresa), y la
  // generación de horarios es intensiva en CPU: pocos workers evita flakes.
  // Medido en local: con 2 navegadores en paralelo `page.goto` tarda ~150 ms;
  // con 3, las peticiones a `/_next/static/*` se quedan colgadas y el evento
  // `load` no llega nunca (timeouts de 90 s). De ahí el tope de 2.
  workers: 2,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: usarDev
      ? `npm run dev -- --port ${PORT}`
      : `npm run build && npm run start -- --port ${PORT}`,
    url: BASE_URL,
    // En modo dev sí se reutiliza: el dev server del puerto 3000 es el que ya
    // está levantado y no puede haber un segundo para el mismo proyecto.
    reuseExistingServer: usarDev || reutilizarServidor,
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      // Ningún test debe disparar un email real: el alta de usuarios hace
      // rollback si el envío falla, así que se usa el sender no-op. Ojo: con
      // E2E_DEV=1 y un dev server ya levantado, Playwright lo reutiliza y este
      // env NO se aplica — pon `EMAIL_TRANSPORT=noop` en `.env.local`.
      EMAIL_TRANSPORT: "noop",
      // Build propio: `next build` aborta si un `next dev` tiene tomado el lock
      // de `.next`, así que la suite compila en `.next-e2e` y convive con él.
      ...(usarDev ? {} : { NEXT_DIST_DIR: ".next-e2e" }),
      APP_URL: BASE_URL,
      AUTH_URL: BASE_URL,
      AUTH_TRUST_HOST: "true",
    },
  },
});
