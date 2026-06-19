import { z } from "zod";
import { Usuario } from "@/domains/identity/domain/usuario.entity";
import { hashPassword } from "@/shared/kernel/password";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { AcceptInvitationRepository } from "@/domains/identity/application/ports/accept-invitation-repository.port";

export const acceptInvitationInputSchema = z.object({
  token: z.string().min(1),
  nombre: z.string().min(2),
  password: z.string().min(8),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationInputSchema>;

export class AcceptInvitationCommand {
  constructor(private readonly repo: AcceptInvitationRepository) {}

  async execute(
    input: AcceptInvitationInput,
  ): Promise<Result<{ usuarioId: string; empresaId: string; email: string }>> {
    const invitacion = await this.repo.buscarPorToken(input.token);
    if (!invitacion) {
      return fail(
        new DomainError("Invitación no encontrada", "INVITACION_NO_ENCONTRADA"),
      );
    }
    if (invitacion.aceptadaEn) {
      return fail(
        new DomainError(
          "Esta invitación ya fue utilizada",
          "INVITACION_YA_ACEPTADA",
        ),
      );
    }
    if (invitacion.expiresAt < new Date()) {
      return fail(
        new DomainError("Esta invitación ha expirado", "INVITACION_EXPIRADA"),
      );
    }

    const passwordHash = await hashPassword(input.password);
    const usuarioResult = Usuario.create({
      email: invitacion.email,
      nombre: input.nombre,
      passwordHash,
      rol: invitacion.rol,
      empresaId: invitacion.empresaId,
      managerId: invitacion.managerId,
    });
    if (!usuarioResult.success) return usuarioResult;

    const { usuarioId, empresaId } = await this.repo.aceptarYCrearUsuario({
      invitacionId: invitacion.id,
      nombre: usuarioResult.value.nombre,
      passwordHash: usuarioResult.value.passwordHash,
    });

    return ok({ usuarioId, empresaId, email: invitacion.email });
  }
}
