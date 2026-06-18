import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";

export type Rol = "ADMIN" | "MANAGER" | "EMPLOYEE";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Usuario {
  private constructor(
    readonly email: string,
    readonly nombre: string,
    readonly passwordHash: string,
    readonly rol: Rol,
    readonly managerId: string | null,
    readonly id?: string,
    readonly empresaId?: string,
  ) {}

  static create(props: {
    email: string;
    nombre: string;
    passwordHash: string;
    rol: Rol;
    empresaId?: string;
    managerId?: string | null;
  }): Result<Usuario> {
    const email = props.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return fail(new DomainError("Email inválido", "USUARIO_EMAIL_INVALIDO"));
    }

    const nombre = props.nombre.trim();
    if (nombre.length < 2) {
      return fail(
        new DomainError(
          "El nombre debe tener al menos 2 caracteres",
          "USUARIO_NOMBRE_INVALIDO",
        ),
      );
    }

    if (props.rol === "EMPLOYEE" && !props.managerId) {
      return fail(
        new DomainError(
          "Un empleado debe tener un manager asignado",
          "USUARIO_SIN_MANAGER",
        ),
      );
    }

    return ok(
      new Usuario(
        email,
        nombre,
        props.passwordHash,
        props.rol,
        props.managerId ?? null,
        undefined,
        props.empresaId,
      ),
    );
  }
}