import type { BloquePlantilla } from "@/domains/shifts/domain/bloque-plantilla";

export interface RegisterOrganizationRepository {
  emailEnUso(email: string): Promise<boolean>;
  crear(input: {
    empresaNombre: string;
    trialEndsAt: Date;
    adminEmail: string;
    adminNombre: string;
    adminPasswordHash: string;
    localNombre: string | null;
    plantilla: BloquePlantilla[];
  }): Promise<{ empresaId: string; usuarioId: string }>;
}
