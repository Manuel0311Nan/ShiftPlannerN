import { z } from "zod";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { Rol } from "@/domains/identity/domain/usuario.entity";
import type {
  UpdateUserRepository,
  UsuarioEditable,
} from "@/domains/identity/application/ports/update-user-repository.port";

export const deleteUserInputSchema = z.object({
  usuarioId: z.string().min(1),
});

export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;

export type DeleteUserContext = {
  editorId: string;
  editorRol: Rol;
};

/**
 * Da de baja una cuenta. Mismas reglas de autorización que la edición: ADMIN
 * cualquier usuario de su empresa, MANAGER solo sus propios EMPLOYEE. Nadie
 * puede borrarse a sí mismo (evita quedarse sin administrador). El schema ya
 * gestiona la cascada (locales/plantillas del manager) y los `SetNull`.
 */
export class DeleteUserCommand {
  constructor(private readonly repo: UpdateUserRepository) {}

  async execute(
    input: DeleteUserInput,
    context: DeleteUserContext,
  ): Promise<Result<{ usuarioId: string }>> {
    if (context.editorRol === "EMPLOYEE") {
      return fail(
        new DomainError(
          "No tienes permiso para eliminar cuentas",
          "DELETE_ROL_NO_PERMITIDO",
        ),
      );
    }

    if (input.usuarioId === context.editorId) {
      return fail(
        new DomainError(
          "No puedes eliminar tu propia cuenta",
          "DELETE_PROPIA_CUENTA",
        ),
      );
    }

    const usuario = await this.repo.obtener(input.usuarioId);
    if (!usuario) {
      return fail(
        new DomainError("Usuario no encontrado", "DELETE_USUARIO_NO_ENCONTRADO"),
      );
    }

    if (!this.puedeEliminar(context, usuario)) {
      return fail(
        new DomainError(
          "No tienes permiso para eliminar este usuario",
          "DELETE_NO_AUTORIZADO",
        ),
      );
    }

    await this.repo.eliminar(usuario.id);
    return ok({ usuarioId: usuario.id });
  }

  private puedeEliminar(
    context: DeleteUserContext,
    usuario: UsuarioEditable,
  ): boolean {
    if (context.editorRol === "ADMIN") return true;
    if (context.editorRol === "MANAGER") {
      return usuario.rol === "EMPLOYEE" && usuario.managerId === context.editorId;
    }
    return false;
  }
}
