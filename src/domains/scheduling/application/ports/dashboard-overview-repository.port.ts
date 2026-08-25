import type {
  BloquePlantillaResumen,
  TurnoDelPeriodo,
} from "@/domains/scheduling/domain/resumen-dashboard";
import type { Rol } from "@/domains/identity/domain/usuario.entity";

/**
 * Quién mira el panel. Determina el alcance de la agregación: ADMIN ve toda la
 * empresa, MANAGER sus locales, EMPLOYEE solo lo suyo. El `empresaId` no viaja
 * aquí: lo garantiza el repositorio tenant-scoped.
 */
export type AlcanceResumen = {
  usuarioId: string;
  rol: Rol;
};

export interface DashboardOverviewRepository {
  /** Turnos del alcance con `inicio` en [desde, hasta). */
  turnosEnRango(
    alcance: AlcanceResumen,
    desde: Date,
    hasta: Date,
  ): Promise<TurnoDelPeriodo[]>;
  /** Bloques de plantilla de los locales del alcance. */
  plantilla(alcance: AlcanceResumen): Promise<BloquePlantillaResumen[]>;
  /** Empleados dentro del alcance. */
  contarPersonal(alcance: AlcanceResumen): Promise<number>;
  /** Solicitudes de disponibilidad pendientes de resolver dentro del alcance. */
  contarSolicitudesPendientes(alcance: AlcanceResumen): Promise<number>;
}
