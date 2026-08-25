import { config as loadEnv } from "dotenv";
import { cerrarDb, limpiarDatosE2E } from "./helpers/db";

loadEnv({ path: ".env.test", override: true, quiet: true });
loadEnv({ path: ".env", quiet: true });

/** Deja la base de datos como estaba: fuera todas las empresas "E2E-…". */
export default async function globalTeardown() {
  try {
    const borradas = await limpiarDatosE2E();
    console.log(`[e2e] empresas de prueba eliminadas: ${borradas}`);
  } finally {
    await cerrarDb();
  }
}
