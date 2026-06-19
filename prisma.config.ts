import "dotenv/config";
import { defineConfig } from "prisma/config";

// Neon: las migraciones necesitan la conexión directa (sin pgbouncer),
// distinta de la DATABASE_URL pooled que usa la app en runtime. En local
// usamos DIRECT_URL; la integración de Neon en Vercel solo expone el
// equivalente como DATABASE_URL_UNPOOLED.
const directUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL_UNPOOLED;
if (!directUrl) {
  throw new Error(
    "Falta DIRECT_URL (o DATABASE_URL_UNPOOLED) en las variables de entorno",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});
