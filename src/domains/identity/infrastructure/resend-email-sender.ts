import { Resend } from "resend";
import { env, getAppUrl } from "@/lib/env";
import type { EmailSender } from "@/domains/identity/application/ports/email-sender.port";
import type { InvitacionRol } from "@/domains/identity/domain/invitacion.entity";

const ROL_LABEL: Record<InvitacionRol, string> = {
  MANAGER: "Manager",
  EMPLOYEE: "Trabajador",
};

export class ResendEmailSender implements EmailSender {
  async enviarInvitacion(input: {
    to: string;
    empresaNombre: string;
    rol: InvitacionRol;
    token: string;
  }): Promise<void> {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no está configurada");
    }

    const client = new Resend(env.RESEND_API_KEY);
    const url = `${getAppUrl()}/invitacion/${input.token}`;

    const { error } = await client.emails.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: `Te invitaron a unirte a ${input.empresaNombre}`,
      html: `<p>Te invitaron a unirte a <strong>${input.empresaNombre}</strong> como ${ROL_LABEL[input.rol]}.</p>
<p><a href="${url}">Aceptar invitación</a></p>
<p>Este enlace expira en 7 días.</p>`,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
