export const TIPOS_TURNO = ["APERTURA", "CIERRE", "PARTIDO"] as const;

export type TipoTurno = (typeof TIPOS_TURNO)[number];

export function esTipoTurno(value: string): value is TipoTurno {
  return (TIPOS_TURNO as readonly string[]).includes(value);
}

export const TIPO_TURNO_LABEL: Record<TipoTurno, string> = {
  APERTURA: "Apertura",
  CIERRE: "Cierre",
  PARTIDO: "Partido",
};
