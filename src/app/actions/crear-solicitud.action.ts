"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  CrearSolicitudDisponibilidadCommand,
  crearSolicitudInputSchema,
} from "@/domains/employees/application/crear-solicitud-disponibilidad.command";
import { PrismaSolicitudDisponibilidadRepository } from "@/domains/employees/infrastructure/solicitud-disponibilidad.repository";

export type CrearSolicitudFormState = { error?: string; success?: boolean };

export async function crearSolicitudAction(
  _prevState: CrearSolicitudFormState,
  formData: FormData,
): Promise<CrearSolicitudFormState> {
  const session = await auth();
  if (!session) {
    return { error: "Tu sesión ha caducado, vuelve a iniciar sesión" };
  }

  const parsed = crearSolicitudInputSchema.safeParse({
    semanaInicio: formData.get("semanaInicio"),
    motivo: formData.get("motivo"),
  });
  if (!parsed.success) {
    return { error: "Revisa los datos del formulario" };
  }

  const command = new CrearSolicitudDisponibilidadCommand(
    new PrismaSolicitudDisponibilidadRepository(session.user.empresaId),
  );
  const result = await command.execute(parsed.data, {
    usuarioId: session.user.id,
  });
  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/solicitudes");
  return { success: true };
}
