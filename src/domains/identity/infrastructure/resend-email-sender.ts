import { Resend } from "resend";
import { env, getAppUrl } from "@/lib/env";
import type { EmailSender } from "@/domains/identity/application/ports/email-sender.port";
import type { NuevoUsuarioRol } from "@/domains/identity/domain/alta-usuario.entity";

const ROL_LABEL: Record<NuevoUsuarioRol, string> = {
  MANAGER: "Manager",
  EMPLOYEE: "Trabajador",
};

export class ResendEmailSender implements EmailSender {
  async enviarCredenciales(input: {
    to: string;
    nombre: string;
    empresaNombre: string;
    rol: NuevoUsuarioRol;
    password: string;
  }): Promise<void> {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no está configurada");
    }

    const client = new Resend(env.RESEND_API_KEY);
    const url = `${getAppUrl()}/login`;

    const { error } = await client.emails.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: `Tu cuenta en ${input.empresaNombre} ya está activa`,
      html: `<p>Hola ${input.nombre}, te dieron acceso a <strong>${input.empresaNombre}</strong> como ${ROL_LABEL[input.rol]}.</p>
<p>Email: ${input.to}<br>Contraseña temporal: <strong>${input.password}</strong></p>
<p><a href="${url}">Iniciar sesión</a></p>
<p>Te recomendamos cambiar la contraseña después de tu primer ingreso.</p>`,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
