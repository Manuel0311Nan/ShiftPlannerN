"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  InviteUserCommand,
  inviteUserInputSchema,
} from "@/domains/identity/application/invite-user.command";
import { PrismaInviteUserRepository } from "@/domains/identity/infrastructure/invite-user.repository";
import { ResendEmailSender } from "@/domains/identity/infrastructure/resend-email-sender";

export type InviteUserFormState = { error?: string; success?: boolean };

export async function inviteUserAction(
  _prevState: InviteUserFormState,
  formData: FormData,
): Promise<InviteUserFormState> {
  const session = await auth();
  if (!session) {
    return { error: "Tu sesión ha caducado, vuelve a iniciar sesión" };
  }

  const plantillaRaw = formData.get("plantilla");
  const disponibilidadRaw = formData.get("disponibilidad");

  const parsed = inviteUserInputSchema.safeParse({
    email: formData.get("email"),
    rol: formData.get("rol"),
    managerId: formData.get("managerId") || undefined,
    localNombre: formData.get("localNombre") || undefined,
    localId: formData.get("localId") || undefined,
    plantilla: plantillaRaw ? JSON.parse(String(plantillaRaw)) : undefined,
    disponibilidad: disponibilidadRaw
      ? JSON.parse(String(disponibilidadRaw))
      : undefined,
  });
  if (!parsed.success) {
    return { error: "Revisa los datos del formulario" };
  }

  const empresa = await prisma.empresa.findUniqueOrThrow({
    where: { id: session.user.empresaId },
    select: { nombre: true },
  });

  const command = new InviteUserCommand(
    new PrismaInviteUserRepository(session.user.empresaId),
    new ResendEmailSender(),
  );

  const result = await command.execute(parsed.data, {
    empresaNombre: empresa.nombre,
    invitadoPorId: session.user.id,
    invitadoPorRol: session.user.rol,
  });

  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/invitaciones");
  return { success: true };
}
