import type { NuevoUsuarioRol } from "@/domains/identity/domain/alta-usuario.entity";
import type { BloquePlantilla } from "@/domains/shifts/domain/bloque-plantilla";
import type { BloqueDisponibilidad } from "@/domains/employees/domain/bloque-disponibilidad";
import type { CondicionTrabajador } from "@/domains/employees/domain/condiciones-trabajador";

export interface CreateUserRepository {
  emailEnUso(email: string): Promise<boolean>;
  localesDeManager(managerId: string): Promise<{ id: string }[]>;
  crear(input: {
    email: string;
    nombre: string;
    passwordHash: string;
    rol: NuevoUsuarioRol;
    managerId: string | null;
    localNombre: string | null;
    plantilla: BloquePlantilla[];
    localId: string | null;
    disponibilidad: BloqueDisponibilidad[];
    condiciones: CondicionTrabajador[];
  }): Promise<{ usuarioId: string }>;
  eliminar(usuarioId: string): Promise<void>;
}
