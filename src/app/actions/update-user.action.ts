"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  UpdateUserCommand,
  updateUserInputSchema,
} from "@/domains/identity/application/update-user.command";
import { PrismaUpdateUserRepository } from "@/domains/identity/infrastructure/update-user.repository";
import { NodemailerEmailSender } from "@/domains/identity/infrastructure/nodemailer-email-sender";

export type UpdateUserFormState = { error?: string; success?: boolean };

export async function updateUserAction(
  _prevState: UpdateUserFormState,
  formData: FormData,
): Promise<UpdateUserFormState> {
  const session = await auth();
  if (!session) {
    return { error: "Tu sesión ha caducado, vuelve a iniciar sesión" };
  }

  const disponibilidadRaw = formData.get("disponibilidad");

  const parsed = updateUserInputSchema.safeParse({
    usuarioId: formData.get("usuarioId"),
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    managerId: formData.get("managerId") || undefined,
    localId: formData.get("localId") || undefined,
    disponibilidad: disponibilidadRaw
      ? JSON.parse(String(disponibilidadRaw))
      : undefined,
    horasContrato: formData.get("horasContrato") || undefined,
    diasLibres: formData.get("diasLibres") || undefined,
  });
  if (!parsed.success) {
    return { error: "Revisa los datos del formulario" };
  }

  const empresa = await prisma.empresa.findUniqueOrThrow({
    where: { id: session.user.empresaId },
    select: { nombre: true },
  });

  const command = new UpdateUserCommand(
    new PrismaUpdateUserRepository(session.user.empresaId),
    new NodemailerEmailSender(),
  );

  const result = await command.execute(parsed.data, {
    empresaNombre: empresa.nombre,
    editorId: session.user.id,
    editorRol: session.user.rol,
  });

  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/empleados");
  revalidatePath("/dashboard/managers");
  revalidatePath("/dashboard/horarios");
  return { success: true };
}
