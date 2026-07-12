"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  UpdateLocalCommand,
  updateLocalInputSchema,
} from "@/domains/shifts/application/update-local.command";
import { PrismaLocalRepository } from "@/domains/shifts/infrastructure/local.repository";

export type UpdateLocalFormState = { error?: string; success?: boolean };

export async function updateLocalAction(
  _prevState: UpdateLocalFormState,
  formData: FormData,
): Promise<UpdateLocalFormState> {
  const session = await auth();
  if (!session || session.user.rol === "EMPLOYEE") {
    return { error: "No tienes permiso para editar locales" };
  }

  const plantillaRaw = formData.get("plantilla");

  const parsed = updateLocalInputSchema.safeParse({
    localId: formData.get("localId"),
    nombre: formData.get("nombre"),
    plantilla: plantillaRaw ? JSON.parse(String(plantillaRaw)) : [],
  });
  if (!parsed.success) {
    return { error: "Revisa los datos del formulario" };
  }

  const command = new UpdateLocalCommand(
    new PrismaLocalRepository(session.user.empresaId),
  );
  const result = await command.execute(parsed.data, {
    usuarioId: session.user.id,
    rol: session.user.rol,
  });

  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/horarios");
  revalidatePath(`/dashboard/locales/${parsed.data.localId}`);
  return { success: true };
}
