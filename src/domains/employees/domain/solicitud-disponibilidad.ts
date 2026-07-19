import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";

/** Antelación mínima (días) con la que un trabajador puede pedir un cambio. */
export const DIAS_ANTELACION_SOLICITUD = 15;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export type SolicitudDisponibilidadValida = {
  semanaInicio: Date;
  motivo: string;
};

/**
 * Valida una solicitud de cambio de disponibilidad. `semanaInicio` debe ser el
 * lunes (a medianoche local) de la semana afectada y estar al menos
 * {@link DIAS_ANTELACION_SOLICITUD} días por delante de `ahora`. El motivo no
 * puede quedar vacío. Función pura: la normalización a lunes vive en el caller.
 */
export function crearSolicitudDisponibilidad(props: {
  semanaInicio: Date;
  motivo: string;
  ahora: Date;
}): Result<SolicitudDisponibilidadValida> {
  const motivo = props.motivo.trim();
  if (motivo.length < 3) {
    return fail(
      new DomainError(
        "Explica brevemente el motivo del cambio",
        "SOLICITUD_MOTIVO_VACIO",
      ),
    );
  }
  if (motivo.length > 500) {
    return fail(
      new DomainError(
        "El motivo no puede superar los 500 caracteres",
        "SOLICITUD_MOTIVO_LARGO",
      ),
    );
  }

  const diasDeAntelacion =
    (props.semanaInicio.getTime() - props.ahora.getTime()) / MS_POR_DIA;
  if (diasDeAntelacion < DIAS_ANTELACION_SOLICITUD) {
    return fail(
      new DomainError(
        `Las solicitudes deben hacerse con al menos ${DIAS_ANTELACION_SOLICITUD} días de antelación a la semana afectada`,
        "SOLICITUD_FUERA_DE_PLAZO",
      ),
    );
  }

  return ok({ semanaInicio: props.semanaInicio, motivo });
}
