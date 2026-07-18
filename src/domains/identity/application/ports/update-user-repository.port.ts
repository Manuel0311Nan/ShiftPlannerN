import type { Rol } from "@/domains/identity/domain/usuario.entity";
import type { BloqueDisponibilidad } from "@/domains/employees/domain/bloque-disponibilidad";

export type UsuarioEditable = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  managerId: string | null;
  localId: string | null;
};

export interface UpdateUserRepository {
  obtener(id: string): Promise<UsuarioEditable | null>;
  emailEnUsoPorOtro(email: string, exceptoId: string): Promise<boolean>;
  localesDeManager(managerId: string): Promise<{ id: string }[]>;
  actualizar(input: {
    id: string;
    nombre: string;
    email: string;
    managerId: string | null;
    localId: string | null;
    disponibilidad: BloqueDisponibilidad[] | null;
    horasContrato: number | null;
  }): Promise<void>;
  eliminar(id: string): Promise<void>;
}
