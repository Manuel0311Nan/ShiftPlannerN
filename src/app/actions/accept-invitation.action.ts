"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import {
  AcceptInvitationCommand,
  acceptInvitationInputSchema,
} from "@/domains/identity/application/accept-invitation.command";
import { PrismaAcceptInvitationRepository } from "@/domains/identity/infrastructure/accept-invitation.repository";

export type AcceptInvitationFormState = { error?: string };

export async function acceptInvitationAction(
  _prevState: AcceptInvitationFormState,
  formData: FormData,
): Promise<AcceptInvitationFormState> {
  const parsed = acceptInvitationInputSchema.safeParse({
    token: formData.get("token"),
    nombre: formData.get("nombre"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Revisa los datos del formulario" };
  }

  const command = new AcceptInvitationCommand(
    new PrismaAcceptInvitationRepository(),
  );
  const result = await command.execute(parsed.data);
  if (!result.success) {
    return { error: result.error.message };
  }

  try {
    await signIn("credentials", {
      email: result.value.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "No se pudo iniciar sesión automáticamente" };
    }
    throw error;
  }

  return {};
}
