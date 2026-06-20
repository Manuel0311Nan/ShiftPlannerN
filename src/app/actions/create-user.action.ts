"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CreateUserCommand,
  createUserInputSchema,
} from "@/domains/identity/application/create-user.command";
import { PrismaCreateUserRepository } from "@/domains/identity/infrastructure/create-user.repository";
import { ResendEmailSender } from "@/domains/identity/infrastructure/resend-email-sender";

export type CreateUserFormState = { error?: string; success?: boolean };

export async function createUserAction(
  _prevState: CreateUserFormState,
  formData: FormData,
): Promise<CreateUserFormState> {
  const session = await auth();
  if (!session) {
    return { error: "Tu sesión ha caducado, vuelve a iniciar sesión" };
  }

  const plantillaRaw = formData.get("plantilla");
  const disponibilidadRaw = formData.get("disponibilidad");

  const parsed = createUserInputSchema.safeParse({
    email: formData.get("email"),
    nombre: formData.get("nombre"),
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

  const command = new CreateUserCommand(
    new PrismaCreateUserRepository(session.user.empresaId),
    new ResendEmailSender(),
  );

  const result = await command.execute(parsed.data, {
    empresaNombre: empresa.nombre,
    creadoPorId: session.user.id,
    creadoPorRol: session.user.rol,
  });

  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/equipo");
  revalidatePath("/dashboard/managers");
  revalidatePath("/dashboard/empleados");
  return { success: true };
}
