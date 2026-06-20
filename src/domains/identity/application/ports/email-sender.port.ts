import type { NuevoUsuarioRol } from "@/domains/identity/domain/alta-usuario.entity";

export interface EmailSender {
  enviarCredenciales(input: {
    to: string;
    nombre: string;
    empresaNombre: string;
    rol: NuevoUsuarioRol;
    password: string;
  }): Promise<void>;
}
