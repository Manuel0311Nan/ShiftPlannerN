"use server";

import { signIn } from "@/auth";
import {
  RegisterOrganizationCommand,
  registerOrganizationInputSchema,
} from "@/domains/identity/application/register-organization.command";
import { PrismaRegisterOrganizationRepository } from "@/domains/identity/infrastructure/register-organization.repository";

export type RegisterFormState = { error?: string };

export async function registerOrganizationAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const plantillaRaw = formData.get("plantilla");

  const parsed = registerOrganizationInputSchema.safeParse({
    empresaNombre: formData.get("empresaNombre"),
    adminNombre: formData.get("adminNombre"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
    esManager: formData.get("esManager") === "on",
    localNombre: formData.get("localNombre") || undefined,
    plantilla: plantillaRaw ? JSON.parse(String(plantillaRaw)) : undefined,
  });

  if (!parsed.success) {
    return { error: "Revisa los datos del formulario" };
  }

  const command = new RegisterOrganizationCommand(
    new PrismaRegisterOrganizationRepository(),
  );
  const result = await command.execute(parsed.data);
  if (!result.success) {
    return { error: result.error.message };
  }

  await signIn("credentials", {
    email: parsed.data.adminEmail,
    password: parsed.data.adminPassword,
    redirectTo: "/dashboard",
  });
  return {};
}
