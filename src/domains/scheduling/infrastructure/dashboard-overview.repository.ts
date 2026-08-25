import { TenantRepository } from "@/shared/kernel/tenant-repository";
import type { DiaSemana } from "@/shared/kernel/dia-semana";
import type {
  BloquePlantillaResumen,
  TurnoDelPeriodo,
} from "@/domains/scheduling/domain/resumen-dashboard";
import type {
  AlcanceResumen,
  DashboardOverviewRepository,
} from "@/domains/scheduling/application/ports/dashboard-overview-repository.port";

export class PrismaDashboardOverviewRepository
  extends TenantRepository
  implements DashboardOverviewRepository
{
  /**
   * Locales que entran en el alcance. `null` = sin restricción de local (ADMIN):
   * no es lo mismo que `[]`, que sería "ningún local" y debe devolver vacío.
   */
  private async localIds(alcance: AlcanceResumen): Promise<string[] | null> {
    if (alcance.rol === "ADMIN") return null;

    if (alcance.rol === "MANAGER") {
      const locales = await this.db.local.findMany({
        where: { managerId: alcance.usuarioId },
        select: { id: true },
      });
      return locales.map((local) => local.id);
    }

    const usuario = await this.db.usuario.findUnique({
      where: { id: alcance.usuarioId },
      select: { localId: true },
    });
    return usuario?.localId ? [usuario.localId] : [];
  }

  async turnosEnRango(
    alcance: AlcanceResumen,
    desde: Date,
    hasta: Date,
  ): Promise<TurnoDelPeriodo[]> {
    // Un empleado solo agrega sus propios turnos, no los de sus compañeros.
    if (alcance.rol === "EMPLOYEE") {
      const turnos = await this.db.turno.findMany({
        where: { usuarioId: alcance.usuarioId, inicio: { gte: desde, lt: hasta } },
        include: { usuario: { select: { nombre: true } } },
        orderBy: { inicio: "asc" },
      });
      return turnos.map(mapearTurno);
    }

    const locales = await this.localIds(alcance);
    if (locales?.length === 0) return [];

    const turnos = await this.db.turno.findMany({
      where: {
        inicio: { gte: desde, lt: hasta },
        ...(locales ? { usuario: { localId: { in: locales } } } : {}),
      },
      include: { usuario: { select: { nombre: true } } },
      orderBy: { inicio: "asc" },
    });
    return turnos.map(mapearTurno);
  }

  async plantilla(alcance: AlcanceResumen): Promise<BloquePlantillaResumen[]> {
    const locales = await this.localIds(alcance);
    if (locales?.length === 0) return [];

    const bloques = await this.db.plantillaTurno.findMany({
      where: locales ? { localId: { in: locales } } : {},
      select: {
        diaSemana: true,
        nombre: true,
        horaInicio: true,
        horaFin: true,
        personasRequeridas: true,
        local: { select: { nombre: true } },
      },
    });

    return bloques.map((bloque) => ({
      localNombre: bloque.local.nombre,
      diaSemana: bloque.diaSemana as DiaSemana,
      nombre: bloque.nombre,
      horaInicio: bloque.horaInicio,
      horaFin: bloque.horaFin,
      personasRequeridas: bloque.personasRequeridas,
    }));
  }

  async contarPersonal(alcance: AlcanceResumen): Promise<number> {
    const locales = await this.localIds(alcance);
    if (locales?.length === 0) return 0;

    return this.db.usuario.count({
      where: {
        rol: "EMPLOYEE",
        ...(locales ? { localId: { in: locales } } : {}),
      },
    });
  }

  async contarSolicitudesPendientes(alcance: AlcanceResumen): Promise<number> {
    if (alcance.rol === "EMPLOYEE") {
      return this.db.solicitudDisponibilidad.count({
        where: { usuarioId: alcance.usuarioId, estado: "PENDIENTE" },
      });
    }

    const locales = await this.localIds(alcance);
    if (locales?.length === 0) return 0;

    return this.db.solicitudDisponibilidad.count({
      where: {
        estado: "PENDIENTE",
        ...(locales ? { usuario: { localId: { in: locales } } } : {}),
      },
    });
  }
}

function mapearTurno(turno: {
  usuarioId: string;
  inicio: Date;
  fin: Date;
  usuario: { nombre: string };
}): TurnoDelPeriodo {
  return {
    usuarioId: turno.usuarioId,
    usuarioNombre: turno.usuario.nombre,
    inicio: turno.inicio,
    fin: turno.fin,
  };
}
