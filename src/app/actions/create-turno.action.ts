"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  CreateTurnoCommand,
  createTurnoInputSchema,
} from "@/domains/scheduling/application/create-turno.command";
import { PrismaTurnoRepository } from "@/domains/scheduling/infrastructure/turno.repository";
import {
  actionError,
  toActionResult,
  type ActionResult,
} from "@/shared/kernel/action-result";

export async function createTurnoAction(
  input: unknown,
): Promise<ActionResult<{ id: string; advertencias: string[] }>> {
  const session = await auth();
  if (!session || session.user.rol === "EMPLOYEE") {
    return actionError("No tienes permiso para crear turnos", "NO_AUTORIZADO");
  }

  const parsed = createTurnoInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Datos del turno inválidos", "INPUT_INVALIDO");
  }

  const command = new CreateTurnoCommand(
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
