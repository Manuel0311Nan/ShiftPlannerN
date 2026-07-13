"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  DeleteUserCommand,
  deleteUserInputSchema,
} from "@/domains/identity/application/delete-user.command";
import { PrismaUpdateUserRepository } from "@/domains/identity/infrastructure/update-user.repository";
import {
  actionError,
  toActionResult,
  type ActionResult,
} from "@/shared/kernel/action-result";

export async function deleteUserAction(
  input: unknown,
): Promise<ActionResult<{ usuarioId: string }>> {
  const session = await auth();
  if (!session || session.user.rol === "EMPLOYEE") {
    return actionError(
      "No tienes permiso para eliminar cuentas",
      "NO_AUTORIZADO",
    );
  }

  const parsed = deleteUserInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Datos inválidos", "INPUT_INVALIDO");
  }

  const command = new DeleteUserCommand(
    new PrismaUpdateUserRepository(session.user.empresaId),
  );
  const result = await command.execute(parsed.data, {
    editorId: session.user.id,
    editorRol: session.user.rol,
  });

  if (result.success) {
    revalidatePath("/dashboard/empleados");
    revalidatePath("/dashboard/managers");
    revalidatePath("/dashboard/horarios");
  }
  return toActionResult(result);
}
