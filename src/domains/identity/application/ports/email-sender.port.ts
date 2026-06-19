import type { InvitacionRol } from "@/domains/identity/domain/invitacion.entity";

export interface EmailSender {
  enviarInvitacion(input: {
    to: string;
    empresaNombre: string;
    rol: InvitacionRol;
    token: string;
  }): Promise<void>;
}
