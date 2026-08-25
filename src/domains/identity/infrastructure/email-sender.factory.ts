import { env } from "@/lib/env";
import type { EmailSender } from "@/domains/identity/application/ports/email-sender.port";
import { NodemailerEmailSender } from "./nodemailer-email-sender";
import { ResendEmailSender } from "./resend-email-sender";

/**
 * Sender que no envía nada: solo deja traza en logs. Existe para los tests
 * end-to-end (EMAIL_TRANSPORT=noop), donde `CreateUserCommand` haría rollback
 * del alta si el envío fallara y no queremos depender del SMTP real.
 */
class NoopEmailSender implements EmailSender {
  async enviarCredenciales(input: { to: string; password: string }): Promise<void> {
    console.info(`[email:noop] credenciales para ${input.to} (${input.password})`);
  }

  async notificarCambioEmail(input: { to: string }): Promise<void> {
    console.info(`[email:noop] cambio de email notificado a ${input.to}`);
  }
}

/** Implementación de `EmailSender` según `EMAIL_TRANSPORT` (por defecto Gmail). */
export function createEmailSender(): EmailSender {
  switch (env.EMAIL_TRANSPORT) {
    case "noop":
      return new NoopEmailSender();
    case "resend":
      return new ResendEmailSender();
    default:
      return new NodemailerEmailSender();
  }
}
