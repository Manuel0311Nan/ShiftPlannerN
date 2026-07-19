"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  ResolverSolicitudDisponibilidadCommand,
  resolverSolicitudInputSchema,
} from "@/domains/employees/application/resolver-solicitud-disponibilidad.command";
import { PrismaSolicitudDisponibilidadRepository } from "@/domains/employees/infrastructure/solicitud-disponibilidad.repository";

export type ResolverSolicitudFormState = { error?: string; success?: boolean };

export async function resolverSolicitudAction(
  _prevState: ResolverSolicitudFormState,
  formData: FormData,
): Promise<ResolverSolicitudFormState> {
  const session = await auth();
  if (!session) {
    return { error: "Tu sesión ha caducado, vuelve a iniciar sesión" };
  }

  const disponibilidadRaw = formData.get("disponibilidad");
  const parsed = resolverSolicitudInputSchema.safeParse({
    solicitudId: formData.get("solicitudId"),
    estado: formData.get("estado"),
    respuesta: formData.get("respuesta") || undefined,
    disponibilidad: disponibilidadRaw
      ? JSON.parse(String(disponibilidadRaw))
      : undefined,
  });
  if (!parsed.success) {
    return { error: "Revisa los datos del formulario" };
  }

  const command = new ResolverSolicitudDisponibilidadCommand(
    new PrismaSolicitudDisponibilidadRepository(session.user.empresaId),
  );
  const result = await command.execute(parsed.data, {
    editorId: session.user.id,
    editorRol: session.user.rol,
  });
  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/solicitudes");
  revalidatePath("/dashboard/horarios");
  return { success: true };
}
