"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  UpdateTurnoCommand,
  updateTurnoInputSchema,
} from "@/domains/scheduling/application/update-turno.command";
import { PrismaTurnoRepository } from "@/domains/scheduling/infrastructure/turno.repository";
import {
  actionError,
  toActionResult,
  type ActionResult,
} from "@/shared/kernel/action-result";

export async function updateTurnoAction(
  input: unknown,
): Promise<ActionResult<{ advertencias: string[] }>> {
  const session = await auth();
  if (!session || session.user.rol === "EMPLOYEE") {
    return actionError("No tienes permiso para editar turnos", "NO_AUTORIZADO");
  }

  const parsed = updateTurnoInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Datos del turno inválidos", "INPUT_INVALIDO");
  }

  const command = new UpdateTurnoCommand(
    new PrismaTurnoRepository(session.user.empresaId),
  );
  const result = await command.execute(parsed.data, {
    usuarioId: session.user.id,
    rol: session.user.rol,
  });

  if (result.success) {
    revalidatePath("/dashboard/horarios");
  }
  return toActionResult(result);
}
