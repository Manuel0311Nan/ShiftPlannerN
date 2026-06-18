"use server";

import {
  RegisterOrganizationCommand,
  registerOrganizationInputSchema,
} from "@/domains/identity/application/register-organization.command";
import { PrismaRegisterOrganizationRepository } from "@/domains/identity/infrastructure/register-organization.repository";
import { DomainError, fail, type Result } from "@/shared/kernel/result";

export async function registerOrganizationAction(
  formData: FormData,
): Promise<Result<{ empresaId: string; usuarioId: string }>> {
  const parsed = registerOrganizationInputSchema.safeParse({
    empresaNombre: formData.get("empresaNombre"),
    adminNombre: formData.get("adminNombre"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
  });

  if (!parsed.success) {
    return fail(
      new DomainError("Datos de registro inválidos", "REGISTRO_INPUT_INVALIDO"),
    );
  }

  const command = new RegisterOrganizationCommand(
    new PrismaRegisterOrganizationRepository(),
  );
  return command.execute(parsed.data);
}
