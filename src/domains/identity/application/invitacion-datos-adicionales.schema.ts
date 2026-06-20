import { z } from "zod";

export const bloquePlantillaSchema = z.object({
  diaSemana: z.string(),
  nombre: z.string(),
  horaInicio: z.string(),
  horaFin: z.string(),
  personasRequeridas: z.coerce.number().int(),
});

export const bloqueDisponibilidadSchema = z.object({
  diaSemana: z.string(),
  horaInicio: z.string(),
  horaFin: z.string(),
});

export const managerDatosAdicionalesSchema = z.object({
  localNombre: z.string(),
  plantilla: z.array(bloquePlantillaSchema),
});

export const employeeDatosAdicionalesSchema = z.object({
  localId: z.string().nullable(),
  disponibilidad: z.array(bloqueDisponibilidadSchema),
});
