import { z } from "zod";
import { EMAIL_REGEX } from "@/shared/kernel/email";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { Rol } from "@/domains/identity/domain/usuario.entity";
import {
  crearBloqueDisponibilidad,
  type BloqueDisponibilidad,
} from "@/domains/employees/domain/bloque-disponibilidad";
import type { EmailSender } from "@/domains/identity/application/ports/email-sender.port";
import type {
  UpdateUserRepository,
  UsuarioEditable,
} from "@/domains/identity/application/ports/update-user-repository.port";

const bloqueDisponibilidadSchema = z.object({
  diaSemana: z.string(),
  horaInicio: z.string(),
  horaFin: z.string(),
});

export const updateUserInputSchema = z.object({
  usuarioId: z.string().min(1),
  nombre: z.string().min(2),
  email: z.string().email(),
  managerId: z.string().optional(),
  localId: z.string().optional(),
  disponibilidad: z.array(bloqueDisponibilidadSchema).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export type UpdateUserContext = {
  empresaNombre: string;
  editorId: string;
  editorRol: Rol;
};

/**
 * Edita los datos de una cuenta ya creada. Un ADMIN gestiona cualquier
 * usuario de su empresa; un MANAGER solo sus propios EMPLOYEE; un EMPLOYEE
 * no edita cuentas. Al cambiar el email se notifica al usuario en la nueva
 * dirección (best-effort, no se regenera contraseña).
 */
export class UpdateUserCommand {
  constructor(
    private readonly repo: UpdateUserRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(
    input: UpdateUserInput,
    context: UpdateUserContext,
  ): Promise<Result<{ usuarioId: string }>> {
    if (context.editorRol === "EMPLOYEE") {
      return fail(
        new DomainError(
          "No tienes permiso para editar cuentas",
          "EDIT_ROL_NO_PERMITIDO",
        ),
      );
    }

    const usuario = await this.repo.obtener(input.usuarioId);
    if (!usuario) {
      return fail(
        new DomainError("Usuario no encontrado", "EDIT_USUARIO_NO_ENCONTRADO"),
      );
    }

    if (!this.puedeEditar(context, usuario)) {
      return fail(
        new DomainError(
          "No tienes permiso para editar este usuario",
          "EDIT_NO_AUTORIZADO",
        ),
      );
    }

    const nombre = input.nombre.trim();
    if (nombre.length < 2) {
      return fail(
        new DomainError(
          "El nombre debe tener al menos 2 caracteres",
          "EDIT_NOMBRE_INVALIDO",
        ),
      );
    }

    const email = input.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return fail(new DomainError("Email inválido", "EDIT_EMAIL_INVALIDO"));
    }
    if (
      email !== usuario.email &&
      (await this.repo.emailEnUsoPorOtro(email, usuario.id))
    ) {
      return fail(
        new DomainError(
          "Ya existe una cuenta con ese email",
          "EDIT_EMAIL_DUPLICADO",
        ),
      );
    }

    let managerId: string | null = usuario.managerId;
    let localId: string | null = usuario.localId;
    let disponibilidad: BloqueDisponibilidad[] | null = null;

    if (usuario.rol === "EMPLOYEE") {
      // Solo un ADMIN puede reasignar de manager; un MANAGER edita a los
      // suyos y mantiene la asignación.
      if (context.editorRol === "ADMIN" && input.managerId) {
        managerId = input.managerId;
      }
      if (!managerId) {
        return fail(
          new DomainError("Debes seleccionar un manager", "EDIT_SIN_MANAGER"),
        );
      }

      const locales = await this.repo.localesDeManager(managerId);
      if (locales.length === 0) {
        return fail(
          new DomainError(
            "El manager todavía no tiene ningún local",
            "EDIT_MANAGER_SIN_LOCAL",
          ),
        );
      }
      if (input.localId) {
        if (!locales.some((local) => local.id === input.localId)) {
          return fail(
            new DomainError(
              "El local seleccionado no es válido",
              "EDIT_LOCAL_INVALIDO",
            ),
          );
        }
        localId = input.localId;
      } else if (locales.length === 1) {
        localId = locales[0].id;
      } else {
        return fail(
          new DomainError(
            "Debes seleccionar a qué local pertenece este trabajador",
            "EDIT_SIN_LOCAL",
          ),
        );
      }

      if (!input.disponibilidad || input.disponibilidad.length === 0) {
        return fail(
          new DomainError(
            "El trabajador necesita al menos un bloque de disponibilidad",
            "EDIT_DISPONIBILIDAD_VACIA",
          ),
        );
      }
      const bloques: BloqueDisponibilidad[] = [];
      for (const bloque of input.disponibilidad) {
        const result = crearBloqueDisponibilidad(bloque);
        if (!result.success) return result;
        bloques.push(result.value);
      }
      disponibilidad = bloques;
    }

    await this.repo.actualizar({
      id: usuario.id,
      nombre,
      email,
      managerId,
      localId,
      disponibilidad,
    });

    if (email !== usuario.email) {
      try {
        await this.emailSender.notificarCambioEmail({
          to: email,
          nombre,
          empresaNombre: context.empresaNombre,
        });
      } catch {
        // El cambio ya se guardó; la notificación es best-effort.
      }
    }

    return ok({ usuarioId: usuario.id });
  }

  private puedeEditar(
    context: UpdateUserContext,
    usuario: UsuarioEditable,
  ): boolean {
    if (context.editorRol === "ADMIN") return true;
    if (context.editorRol === "MANAGER") {
      return usuario.rol === "EMPLOYEE" && usuario.managerId === context.editorId;
    }
    return false;
  }
}
