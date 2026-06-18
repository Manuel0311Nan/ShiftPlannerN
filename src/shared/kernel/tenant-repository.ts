import { tenantPrisma, type TenantPrismaClient } from "@/shared/kernel/tenant-prisma";

/**
 * Base para repositorios de infraestructura que operan sobre entidades con
 * `empresaId`. `this.db` ya viene acotado al tenant: usarlo en vez de
 * importar `prisma` directamente es lo que garantiza el aislamiento.
 */
export abstract class TenantRepository {
  protected readonly db: TenantPrismaClient;

  constructor(protected readonly empresaId: string) {
    this.db = tenantPrisma(empresaId);
  }
}
