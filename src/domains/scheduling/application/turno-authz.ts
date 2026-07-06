import type { Rol } from "@/domains/identity/domain/usuario.entity";

export type TurnoCommandContext = {
  usuarioId: string;
  rol: Rol;
};

/**
 * Un ADMIN gestiona cualquier local de su empresa; un MANAGER solo el local
 * del que es dueño. Un EMPLOYEE nunca edita turnos. El `empresaId` ya lo
 * garantiza el repositorio tenant-scoped, aquí solo se decide local/rol.
 */
export function puedeGestionarLocal(
  context: TurnoCommandContext,
  managerIdDelLocal: string | null,
): boolean {
  if (context.rol === "ADMIN") return true;
  if (context.rol === "MANAGER") {
    return managerIdDelLocal !== null && managerIdDelLocal === context.usuarioId;
  }
  return false;
}
