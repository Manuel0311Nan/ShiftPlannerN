import nodemailer from "nodemailer";
import { env, getAppUrl } from "@/lib/env";
import type { EmailSender } from "@/domains/identity/application/ports/email-sender.port";
import type { NuevoUsuarioRol } from "@/domains/identity/domain/alta-usuario.entity";

const ROL_LABEL: Record<NuevoUsuarioRol, string> = {
  MANAGER: "Manager",
  EMPLOYEE: "Trabajador",
};

/**
 * Envía las credenciales vía SMTP de Gmail desde un remitente genérico único
 * (env.GMAIL_USER, p. ej. infoscheduleia@gmail.com) común a todas las empresas.
 * El nombre visible del remitente es el de la empresa, para que el destinatario
 * lo perciba como suyo; la contraseña temporal viaja solo en el email (nunca se
 * persiste en claro).
 */
export class NodemailerEmailSender implements EmailSender {
  async enviarCredenciales(input: {
    to: string;
    nombre: string;
    empresaNombre: string;
    rol: NuevoUsuarioRol;
    password: string;
  }): Promise<void> {
    if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
      throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD no están configuradas");
    }

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
      // Algunos antivirus/proxies corporativos hacen inspección TLS en local y
      // presentan un certificado self-signed que Node rechaza (ESOCKET). Se
      // relaja la verificación SOLO fuera de producción; en prod (Vercel) la
      // cadena de Gmail es válida y se verifica normalmente.
      ...(process.env.NODE_ENV !== "production"
        ? { tls: { rejectUnauthorized: false } }
        : {}),
    });

    const url = `${getAppUrl()}/login`;

    await transport.sendMail({
      // La dirección debe ser la cuenta autenticada; el nombre visible es la
      // empresa. Se escapan comillas del nombre para no romper la cabecera.
      from: `"${input.empresaNombre.replace(/"/g, "'")}" <${env.GMAIL_USER}>`,
      to: input.to,
      subject: `Tu cuenta en ${input.empresaNombre} ya está activa`,
      html: `<p>Hola ${input.nombre}, te dieron acceso a <strong>${input.empresaNombre}</strong> como ${ROL_LABEL[input.rol]}.</p>
<p>Email: ${input.to}<br>Contraseña temporal: <strong>${input.password}</strong></p>
<p><a href="${url}">Iniciar sesión</a></p>
<p>Te recomendamos cambiar la contraseña después de tu primer ingreso.</p>`,
    });
  }
}
