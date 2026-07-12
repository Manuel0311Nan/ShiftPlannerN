import type { BloquePlantilla } from "@/domains/shifts/domain/bloque-plantilla";

export type LocalConManager = {
  id: string;
  nombre: string;
  managerId: string | null;
};

export interface LocalRepository {
  obtenerConManager(id: string): Promise<LocalConManager | null>;
  actualizarPlantilla(input: {
    localId: string;
    nombre: string;
    plantilla: BloquePlantilla[];
  }): Promise<void>;
  eliminar(id: string): Promise<void>;
}
