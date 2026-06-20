import { z } from "zod";
import { Empresa } from "@/domains/organizations/domain/empresa.entity";
import { Usuario } from "@/domains/identity/domain/usuario.entity";
import { hashPassword } from "@/shared/kernel/password";
import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import type { RegisterOrganizationRepository } from "@/domains/identity/application/ports/register-organization-repository.port";
import {
  crearBloquePlantilla,
  type BloquePlantilla,
} from "@/domains/shifts/domain/bloque-plantilla";

const bloquePlantillaSchema = z.object({
  diaSemana: z.string(),
  nombre: z.string(),
  horaInicio: z.string(),
  horaFin: z.string(),
  personasRequeridas: z.coerce.number().int(),
});

export const registerOrganizationInputSchema = z.object({
  empresaNombre: z.string().min(2),
  adminNombre: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  esManager: z.coerce.boolean().optional(),
  localNombre: z.string().optional(),
  plantilla: z.array(bloquePlantillaSchema).optional(),
});

export type RegisterOrganizationInput = z.infer<
  typeof registerOrganizationInputSchema
>;

export class RegisterOrganizationCommand {
  constructor(private readonly repo: RegisterOrganizationRepository) {}

  async execute(
    input: RegisterOrganizationInput,
  ): Promise<Result<{ empresaId: string; usuarioId: string }>> {
    const empresaResult = Empresa.create({ nombre: input.empresaNombre });
    if (!empresaResult.success) return empresaResult;

    if (await this.repo.emailEnUso(input.adminEmail)) {
      return fail(
        new DomainError(
          "Ya existe una cuenta con ese email",
          "USUARIO_EMAIL_DUPLICADO",
        ),
      );
    }

    let localNombre: string | null = null;
    let plantilla: BloquePlantilla[] = [];
    if (input.esManager) {
      const nombre = (input.localNombre ?? "").trim();
      if (nombre.length < 2) {
        return fail(
          new DomainError(
            "El nombre del local debe tener al menos 2 caracteres",
            "ALTA_LOCAL_INVALIDO",
          ),
        );
      }
      if (!input.plantilla || input.plantilla.length === 0) {
        return fail(
          new DomainError(
            "El local necesita al menos un bloque de turno",
            "ALTA_PLANTILLA_VACIA",
          ),
        );
      }
      const bloques: BloquePlantilla[] = [];
      for (const bloque of input.plantilla) {
        const result = crearBloquePlantilla(bloque);
        if (!result.success) return result;
        bloques.push(result.value);
      }
      localNombre = nombre;
      plantilla = bloques;
    }

    const passwordHash = await hashPassword(input.adminPassword);
    const usuarioResult = Usuario.create({
      email: input.adminEmail,
      nombre: input.adminNombre,
      passwordHash,
      rol: "ADMIN",
    });
    if (!usuarioResult.success) return usuarioResult;

    const { empresaId, usuarioId } = await this.repo.crear({
      empresaNombre: empresaResult.value.nombre,
      trialEndsAt: empresaResult.value.trialEndsAt,
      adminEmail: usuarioResult.value.email,
      adminNombre: usuarioResult.value.nombre,
      adminPasswordHash: usuarioResult.value.passwordHash,
      localNombre,
      plantilla,
    });

    return ok({ empresaId, usuarioId });
  }
}
