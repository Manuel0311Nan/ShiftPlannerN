import type { InvitacionRol } from "@/domains/identity/domain/invitacion.entity";

export interface InviteUserRepository {
  emailEnUso(email: string): Promise<boolean>;
  invitacionPendienteExiste(email: string): Promise<boolean>;
  managerPerteneceATenant(managerId: string): Promise<boolean>;
  crear(input: {
    email: string;
    rol: InvitacionRol;
    managerId: string | null;
    invitadoPorId: string;
    token: string;
    expiresAt: Date;
  }): Promise<{ invitacionId: string }>;
  eliminar(invitacionId: string): Promise<void>;
}
