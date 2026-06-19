import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  // Opcional: Auth.js v5 infiere el host de la request (incluye soporte
  // nativo para VERCEL_URL). Solo hace falta fijarla si se quiere forzar
  // una URL distinta a la detectada.
  AUTH_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);