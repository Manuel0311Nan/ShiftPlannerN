import type { BloqueDisponibilidad } from "@/domains/employees/domain/bloque-disponibilidad";

export type SolicitudEstado = "PENDIENTE" | "ACEPTADA" | "RECHAZADA";

/** Datos mínimos de una solicitud para autorizar y aplicar su resolución. */
export type SolicitudParaResolver = {
  id: string;
  usuarioId: string;
  managerId: string | null;
  semanaInicio: Date;
  estado: SolicitudEstado;
};

export interface SolicitudDisponibilidadRepository {
  crear(input: {
    usuarioId: string;
    semanaInicio: Date;
    motivo: string;
  }): Promise<void>;

  obtenerParaResolver(id: string): Promise<SolicitudParaResolver | null>;

  /**
   * Marca la solicitud como resuelta y, si se acepta con una disponibilidad,
   * reemplaza el override de esa semana para el trabajador. Todo en una
   * transacción.
   */
  resolver(input: {
    solicitudId: string;
    usuarioId: string;
    semanaInicio: Date;
    estado: "ACEPTADA" | "RECHAZADA";
    respuesta: string | null;
    resueltaPorId: string;
    disponibilidadSemana: BloqueDisponibilidad[] | null;
  }): Promise<void>;
}
