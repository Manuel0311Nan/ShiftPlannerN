import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Neon: las migraciones necesitan la conexión directa (sin pgbouncer),
    // distinta de la DATABASE_URL pooled que usa la app en runtime.
    url: env("DIRECT_URL"),
  },
});
