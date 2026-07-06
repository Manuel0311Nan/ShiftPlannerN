import { z } from "zod";

/**
 * Parsea "YYYY-MM-DDTHH:MM(:SS)?" como hora LOCAL construyendo el Date con
 * sus componentes. No usar z.coerce.date() / new Date(string): una cadena
 * date-only se interpreta como UTC y desplazaría el turno según la zona.
 */
export const fechaLocalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/)
  .transform((value) => {
    const [fecha, hora] = value.split("T");
    const [year, month, day] = fecha.split("-").map(Number);
    const [h, m, s] = hora.split(":").map(Number);
    return new Date(year, month - 1, day, h, m, s ?? 0, 0);
  });
