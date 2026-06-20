import { z } from "zod";
import { AltaUsuario } from "@/domains/identity/domain/alta-usuario.entity";
import type { Rol } from "@/domains/identity/domain/usuario.entity";
import { generarPasswordTemporal, hashPassword } from "@/shared/kernel/password";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { CreateUserRepository } from "@/domains/identity/application/ports/create-user-repository.port";
import type { EmailSender } from "@/domains/identity/application/ports/email-sender.port";

const bloquePlantillaSchema = z.object({
  diaSemana: z.string(),
  nombre: z.string(),
  horaInicio: z.string(),
  horaFin: z.string(),
  personasRequeridas: z.coerce.number().int(),
});

const bloqueDisponibilidadSchema = z.object({
  diaSemana: z.string(),
  horaInicio: z.string(),
  horaFin: z.string(),
});

export const createUserInputSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(2),
  rol: z.enum(["MANAGER", "EMPLOYEE"]),
  managerId: z.string().optional(),
  localNombre: z.string().optional(),
  plantilla: z.array(bloquePlantillaSchema).optional(),
  localId: z.string().optional(),
  disponibilidad: z.array(bloqueDisponibilidadSchema).optional(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export type CreateUserContext = {
  empresaNombre: string;
  creadoPorId: string;
  creadoPorRol: Rol;
};

export class CreateUserCommand {
  constructor(
    private readonly repo: CreateUserRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(
    input: CreateUserInput,
    context: CreateUserContext,
  ): Promise<Result<{ usuarioId: string }>> {
    const altaResult = AltaUsuario.create({
      email: input.email,
      nombre: input.nombre,
      rol: input.rol,
      creadoPorId: context.creadoPorId,
      creadoPorRol: context.creadoPorRol,
      managerId: input.managerId,
      localNombre: input.localNombre,
      plantilla: input.plantilla,
      localId: input.localId,
      disponibilidad: input.disponibilidad,
    });
    if (!altaResult.success) return altaResult;
    const alta = altaResult.value;

    if (await this.repo.emailEnUso(alta.email)) {
      return fail(
        new DomainError(
          "Ya existe una cuenta con ese email",
          "USUARIO_EMAIL_DUPLICADO",
        ),
      );
    }

    let resolvedLocalId: string | null = null;
    if (alta.rol === "EMPLOYEE") {
      const locales = await this.repo.localesDeManager(alta.managerId!);
      if (locales.length === 0) {
        return fail(
          new DomainError(
            "El manager todavía no tiene ningún local",
            "ALTA_MANAGER_SIN_LOCAL",
          ),
        );
      }
      if (alta.localId) {
        if (!locales.some((local) => local.id === alta.localId)) {
          return fail(
            new DomainError(
              "El local seleccionado no es válido",
              "ALTA_LOCAL_INVALIDO",
            ),
          );
        }
        resolvedLocalId = alta.localId;
      } else if (locales.length === 1) {
        resolvedLocalId = locales[0].id;
      } else {
        return fail(
          new DomainError(
            "Debes seleccionar a qué local pertenece este trabajador",
            "ALTA_SIN_LOCAL",
          ),
        );
      }
    }

    const password = generarPasswordTemporal();
    const passwordHash = await hashPassword(password);

    const { usuarioId } = await this.repo.crear({
      email: alta.email,
      nombre: alta.nombre,
      passwordHash,
      rol: alta.rol,
      managerId: alta.managerId,
      localNombre: alta.localNombre,
      plantilla: alta.plantilla,
      localId: resolvedLocalId,
      disponibilidad: alta.disponibilidad,
    });

    try {
      await this.emailSender.enviarCredenciales({
        to: alta.email,
        nombre: alta.nombre,
        empresaNombre: context.empresaNombre,
        rol: alta.rol,
        password,
      });
    } catch {
      await this.repo.eliminar(usuarioId);
      return fail(
        new DomainError(
          "No se pudo enviar el email con las credenciales, inténtalo de nuevo",
          "ALTA_EMAIL_FALLIDO",
        ),
      );
    }

    return ok({ usuarioId });
  }
}
