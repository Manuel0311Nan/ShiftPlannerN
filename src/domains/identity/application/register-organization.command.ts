import { z } from "zod";
import { Empresa } from "@/domains/organizations/domain/empresa.entity";
import { Usuario } from "@/domains/identity/domain/usuario.entity";
import { hashPassword } from "@/shared/kernel/password";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { RegisterOrganizationRepository } from "@/domains/identity/application/ports/register-organization-repository.port";

export const registerOrganizationInputSchema = z.object({
  empresaNombre: z.string().min(2),
  adminNombre: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

export type RegisterOrganizationInput = z.infer<
  typeof registerOrganizationInputSchema
>;

export class RegisterOrganizationCommand {
  constructor(private readonly repo: RegisterOrganizationRepository) {}

  async execute(
    input: RegisterOrganizationInput,
  ): Promise<Result<{ empresaId: string; usuarioId: string }>> {
    const empresaResult = Empresa.create({ nombre: input.empresaNombre });
    if (!empresaResult.success) return empresaResult;

    if (await this.repo.emailEnUso(input.adminEmail)) {
      return fail(
        new DomainError(
          "Ya existe una cuenta con ese email",
          "USUARIO_EMAIL_DUPLICADO",
        ),
      );
    }

    const passwordHash = await hashPassword(input.adminPassword);
    const usuarioResult = Usuario.create({
      email: input.adminEmail,
      nombre: input.adminNombre,
      passwordHash,
      rol: "ADMIN",
    });
    if (!usuarioResult.success) return usuarioResult;

    const { empresaId, usuarioId } = await this.repo.crear({
      empresaNombre: empresaResult.value.nombre,
      trialEndsAt: empresaResult.value.trialEndsAt,
      adminEmail: usuarioResult.value.email,
      adminNombre: usuarioResult.value.nombre,
      adminPasswordHash: usuarioResult.value.passwordHash,
    });

    return ok({ empresaId, usuarioId });
  }
}
