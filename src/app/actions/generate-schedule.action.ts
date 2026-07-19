"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  GenerateScheduleCommand,
  generateScheduleInputSchema,
  type CondicionIncumplida,
  type HorasIncumplidas,
  type HuecoReporte,
} from "@/domains/scheduling/application/generate-schedule.command";
import { PrismaGenerateScheduleRepository } from "@/domains/scheduling/infrastructure/generate-schedule.repository";
import { YalpsScheduleSolver } from "@/domains/scheduling/infrastructure/yalps-solver";

export type GenerateScheduleFormState = {
  error?: string;
  generado?: boolean;
  parcial?: boolean;
  aproximado?: boolean;
  turnosCreados?: number;
  huecos?: HuecoReporte[];
  condicionesIncumplidas?: CondicionIncumplida[];
  horasIncumplidas?: HorasIncumplidas[];
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
    permitirHorasExtra: formData.get("permitirHorasExtra") ?? undefined,
  });
  if (!parsed.success) {
    return { error: "Selecciona un local y una semana válidos" };
  }

  const command = new GenerateScheduleCommand(
    new PrismaGenerateScheduleRepository(session.user.empresaId),
    new YalpsScheduleSolver(),
  );

  try {
    const result = await command.execute(parsed.data, {
      invitadoPorId: session.user.id,
      invitadoPorRol: session.user.rol,
    });

    if (!result.success) {
      return { error: result.error.message };
    }

    // parcial también persiste (borra + crea lo posible), así que hay que refrescar.
    if (result.value.generado || result.value.parcial) {
      revalidatePath("/dashboard/horarios");
    }
    return {
      generado: result.value.generado,
      parcial: result.value.parcial,
      aproximado: result.value.aproximado,
      turnosCreados: result.value.turnosCreados,
      huecos: result.value.huecos,
      condicionesIncumplidas: result.value.condicionesIncumplidas,
      horasIncumplidas: result.value.horasIncumplidas,
    };
  } catch (error) {
    // Sin este catch, una excepción (Prisma, solver, etc.) dejaba el formulario
    // colgado en "Generando…" sin explicar nada. El detalle real va a los logs
    // del servidor; al usuario le damos un mensaje accionable.
    console.error("[generate-schedule] fallo inesperado:", error);

    const detalle =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    // En desarrollo devolvemos el detalle real para diagnosticar; en producción
    // solo el mensaje genérico (no filtrar internals al usuario final).
    const mensajeBase =
      "No se pudo generar el horario por un error interno. Revisa que el " +
      "local tenga bloques y trabajadores con disponibilidad, e inténtalo de nuevo.";

    return {
      error:
        process.env.NODE_ENV === "production"
          ? mensajeBase
          : `${mensajeBase}\n\n[dev] ${detalle}`,
    };
  }
}
