import { randomBytes } from "node:crypto";
import { EMAIL_REGEX } from "@/shared/kernel/email";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { Rol } from "@/domains/identity/domain/usuario.entity";

export type InvitacionRol = "MANAGER" | "EMPLOYEE";

const INVITATION_EXPIRY_DAYS = 7;

export class Invitacion {
  private constructor(
    readonly email: string,
    readonly rol: InvitacionRol,
    readonly invitadoPorId: string,
    readonly managerId: string | null,
    readonly token: string,
    readonly expiresAt: Date,
  ) {}

  static create(props: {
    email: string;
    rol: InvitacionRol;
    invitadoPorId: string;
    invitadoPorRol: Rol;
    managerId?: string | null;
  }): Result<Invitacion> {
    const email = props.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return fail(
        new DomainError("Email inválido", "INVITACION_EMAIL_INVALIDO"),
      );
    }

    if (props.invitadoPorRol === "EMPLOYEE") {
      return fail(
        new DomainError(
          "Un empleado no puede enviar invitaciones",
          "INVITACION_ROL_NO_PERMITIDO",
        ),
      );
    }

    if (props.rol === "MANAGER" && props.invitadoPorRol !== "ADMIN") {
      return fail(
        new DomainError(
          "Solo un administrador puede invitar a un manager",
          "INVITACION_ROL_NO_PERMITIDO",
        ),
      );
    }

    let managerId: string | null = null;
    if (props.rol === "EMPLOYEE") {
      if (props.invitadoPorRol === "MANAGER") {
        managerId = props.invitadoPorId;
      } else if (!props.managerId) {
        return fail(
          new DomainError(
            "Debes seleccionar un manager",
            "INVITACION_SIN_MANAGER",
          ),
        );
      } else {
        managerId = props.managerId;
      }
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    return ok(
      new Invitacion(email, props.rol, props.invitadoPorId, managerId, token, expiresAt),
    );
  }
}
