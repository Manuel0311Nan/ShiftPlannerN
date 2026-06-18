export interface RegisterOrganizationRepository {
  emailEnUso(email: string): Promise<boolean>;
  crear(input: {
    empresaNombre: string;
    trialEndsAt: Date;
    adminEmail: string;
    adminNombre: string;
    adminPasswordHash: string;
  }): Promise<{ empresaId: string; usuarioId: string }>;
}
