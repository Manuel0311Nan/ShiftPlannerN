import { z } from "zod";
import { Invitacion } from "@/domains/identity/domain/invitacion.entity";
import type { Rol } from "@/domains/identity/domain/usuario.entity";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { InviteUserRepository } from "@/domains/identity/application/ports/invite-user-repository.port";
import type { EmailSender } from "@/domains/identity/application/ports/email-sender.port";
import {
  bloquePlantillaSchema,
  bloqueDisponibilidadSchema,
} from "@/domains/identity/application/invitacion-datos-adicionales.schema";

export const inviteUserInputSchema = z.object({
  email: z.string().email(),
  rol: z.enum(["MANAGER", "EMPLOYEE"]),
  managerId: z.string().optional(),
  localNombre: z.string().optional(),
  plantilla: z.array(bloquePlantillaSchema).optional(),
  localId: z.string().optional(),
  disponibilidad: z.array(bloqueDisponibilidadSchema).optional(),
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
      localNombre: input.localNombre,
      plantilla: input.plantilla,
      localId: input.localId,
      disponibilidad: input.disponibilidad,
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

    let resolvedLocalId: string | null = null;
    if (invitacion.rol === "EMPLOYEE") {
      const locales = await this.repo.localesDeManager(invitacion.managerId!);
      if (invitacion.localId) {
        if (!locales.some((local) => local.id === invitacion.localId)) {
          return fail(
            new DomainError(
              "El local seleccionado no es válido",
              "INVITACION_LOCAL_INVALIDO",
            ),
          );
        }
        resolvedLocalId = invitacion.localId;
      } else if (locales.length === 1) {
        resolvedLocalId = locales[0].id;
      } else if (locales.length === 0) {
        return fail(
          new DomainError(
            "El manager todavía no tiene ningún local",
            "INVITACION_MANAGER_SIN_LOCAL",
          ),
        );
      } else {
        return fail(
          new DomainError(
            "Debes seleccionar a qué local pertenece este trabajador",
            "INVITACION_SIN_LOCAL",
          ),
        );
      }
    }

    const { invitacionId } = await this.repo.crear({
      email: invitacion.email,
      rol: invitacion.rol,
      managerId: invitacion.managerId,
      invitadoPorId: invitacion.invitadoPorId,
      token: invitacion.token,
      expiresAt: invitacion.expiresAt,
      datosAdicionales:
        invitacion.rol === "MANAGER"
          ? { localNombre: invitacion.localNombre, plantilla: invitacion.plantilla }
          : { localId: resolvedLocalId, disponibilidad: invitacion.disponibilidad },
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
