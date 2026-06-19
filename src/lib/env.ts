import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  // Opcional: Auth.js v5 infiere el host de la request (incluye soporte
  // nativo para VERCEL_URL). Solo hace falta fijarla si se quiere forzar
  // una URL distinta a la detectada.
  AUTH_URL: z.string().url().optional(),
  // Opcional: si falta, las invitaciones por email fallan con un error
  // controlado en vez de romper el resto de la app al importar env.ts.
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().default("onboarding@resend.dev"),
  APP_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);

/** Base URL absoluta para construir enlaces (ej. invitaciones) fuera de una request. */
export function getAppUrl(): string {
  return env.APP_URL ?? env.AUTH_URL ?? "http://localhost:3000";
}
