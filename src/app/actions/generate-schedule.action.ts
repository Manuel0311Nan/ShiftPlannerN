"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  GenerateScheduleCommand,
  generateScheduleInputSchema,
  type CondicionIncumplida,
  type HuecoReporte,
} from "@/domains/scheduling/application/generate-schedule.command";
import { PrismaGenerateScheduleRepository } from "@/domains/scheduling/infrastructure/generate-schedule.repository";
import { YalpsScheduleSolver } from "@/domains/scheduling/infrastructure/yalps-solver";

export type GenerateScheduleFormState = {
  error?: string;
  generado?: boolean;
  turnosCreados?: number;
  huecos?: HuecoReporte[];
  condicionesIncumplidas?: CondicionIncumplida[];
};

export async function generateScheduleAction(
  _prevState: GenerateScheduleFormState,
  formData: FormData,
): Promise<GenerateScheduleFormState> {
  const session = await auth();
  if (!session || session.user.rol === "EMPLOYEE") {
    return { error: "No tienes permiso para generar horarios" };
  }

  const parsed = generateScheduleInputSchema.safeParse({
    localId: formData.get("localId"),
    semanaInicio: formData.get("semanaInicio"),
  });
  if (!parsed.success) {
    return { error: "Selecciona un local y una semana válidos" };
  }

  const command = new GenerateScheduleCommand(
    new PrismaGenerateScheduleRepository(session.user.empresaId),
    new YalpsScheduleSolver(),
  );
  const result = await command.execute(parsed.data, {
    invitadoPorId: session.user.id,
    invitadoPorRol: session.user.rol,
  });

  if (!result.success) {
    return { error: result.error.message };
  }

  if (result.value.generado) {
    revalidatePath("/dashboard/horarios");
  }
  return {
    generado: result.value.generado,
    turnosCreados: result.value.turnosCreados,
    huecos: result.value.huecos,
    condicionesIncumplidas: result.value.condicionesIncumplidas,
  };
}
