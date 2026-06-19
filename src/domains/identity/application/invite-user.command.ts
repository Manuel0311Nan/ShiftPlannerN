import { z } from "zod";
import { Invitacion } from "@/domains/identity/domain/invitacion.entity";
import type { Rol } from "@/domains/identity/domain/usuario.entity";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { InviteUserRepository } from "@/domains/identity/application/ports/invite-user-repository.port";
import type { EmailSender } from "@/domains/identity/application/ports/email-sender.port";

export const inviteUserInputSchema = z.object({
  email: z.string().email(),
  rol: z.enum(["MANAGER", "EMPLOYEE"]),
  managerId: z.string().optional(),
});

export type InviteUserInput = z.infer<typeof inviteUserInputSchema>;

export type InviteUserContext = {
  empresaNombre: string;
  invitadoPorId: string;
  invitadoPorRol: Rol;
};

export class InviteUserCommand {
  constructor(
    private readonly repo: InviteUserRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(
    input: InviteUserInput,
    context: InviteUserContext,
  ): Promise<Result<{ invitacionId: string }>> {
    const invitacionResult = Invitacion.create({
      email: input.email,
      rol: input.rol,
      invitadoPorId: context.invitadoPorId,
      invitadoPorRol: context.invitadoPorRol,
      managerId: input.managerId,
    });
    if (!invitacionResult.success) return invitacionResult;
    const invitacion = invitacionResult.value;

    if (await this.repo.emailEnUso(invitacion.email)) {
      return fail(
        new DomainError(
          "Ya existe una cuenta con ese email",
          "USUARIO_EMAIL_DUPLICADO",
        ),
      );
    }

    if (await this.repo.invitacionPendienteExiste(invitacion.email)) {
      return fail(
        new DomainError(
          "Ya hay una invitación pendiente para ese email",
          "INVITACION_DUPLICADA",
        ),
      );
    }

    if (
      invitacion.managerId &&
      !(await this.repo.managerPerteneceATenant(invitacion.managerId))
    ) {
      return fail(
        new DomainError(
          "El manager seleccionado no es válido",
          "INVITACION_MANAGER_INVALIDO",
        ),
      );
    }

    const { invitacionId } = await this.repo.crear({
      email: invitacion.email,
      rol: invitacion.rol,
      managerId: invitacion.managerId,
      invitadoPorId: invitacion.invitadoPorId,
      token: invitacion.token,
      expiresAt: invitacion.expiresAt,
    });

    try {
      await this.emailSender.enviarInvitacion({
        to: invitacion.email,
        empresaNombre: context.empresaNombre,
        rol: invitacion.rol,
        token: invitacion.token,
      });
    } catch {
      await this.repo.eliminar(invitacionId);
      return fail(
        new DomainError(
          "No se pudo enviar el email de invitación, inténtalo de nuevo",
          "INVITACION_EMAIL_FALLIDO",
        ),
      );
    }

    return ok({ invitacionId });
  }
}
