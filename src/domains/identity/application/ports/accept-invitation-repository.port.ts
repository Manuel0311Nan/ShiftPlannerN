import type { InvitacionRol } from "@/domains/identity/domain/invitacion.entity";

export interface InvitacionPorToken {
  id: string;
  email: string;
  rol: InvitacionRol;
  empresaId: string;
  managerId: string | null;
  expiresAt: Date;
  aceptadaEn: Date | null;
}

export interface AcceptInvitationRepository {
  buscarPorToken(token: string): Promise<InvitacionPorToken | null>;
  aceptarYCrearUsuario(input: {
    invitacionId: string;
    nombre: string;
    passwordHash: string;
  }): Promise<{ usuarioId: string; empresaId: string }>;
}
