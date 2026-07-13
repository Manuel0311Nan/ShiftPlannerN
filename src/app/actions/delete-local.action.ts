"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  DeleteLocalCommand,
  deleteLocalInputSchema,
} from "@/domains/shifts/application/delete-local.command";
import { PrismaLocalRepository } from "@/domains/shifts/infrastructure/local.repository";
import {
  actionError,
  toActionResult,
  type ActionResult,
} from "@/shared/kernel/action-result";

export async function deleteLocalAction(
  input: unknown,
): Promise<ActionResult<{ localId: string }>> {
  const session = await auth();
  if (!session || session.user.rol === "EMPLOYEE") {
    return actionError(
      "No tienes permiso para eliminar locales",
      "NO_AUTORIZADO",
    );
  }

  const parsed = deleteLocalInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Datos inválidos", "INPUT_INVALIDO");
  }

  const command = new DeleteLocalCommand(
    new PrismaLocalRepository(session.user.empresaId),
  );
  const result = await command.execute(parsed.data, {
    usuarioId: session.user.id,
    rol: session.user.rol,
  });

  if (result.success) {
    revalidatePath("/dashboard/horarios");
    revalidatePath("/dashboard/managers");
  }
  return toActionResult(result);
}
