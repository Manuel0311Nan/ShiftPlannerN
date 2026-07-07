/**
 * Descripción de un modelo de programación lineal entera **agnóstica del
 * solver**. El dominio construye este tipo; un adaptador de infraestructura lo
 * traduce a la librería concreta (yalps). Así el solver es intercambiable sin
 * tocar dominio ni use case.
 */
export type Restriccion = { min?: number; max?: number; equal?: number };

export type ModeloILP = {
  objetivo: "maximizar" | "minimizar";
  /** Clave con la que las variables declaran su coeficiente en el objetivo. */
  nombreObjetivo: string;
  restricciones: Record<string, Restriccion>;
  /** variable → { [restricción u objetivo]: coeficiente }. */
  variables: Record<string, Record<string, number>>;
  binarias: string[];
  enteras: string[];
};

export type EstadoSolucion = "optimal" | "infeasible" | "otro";

export type SolucionILP = {
  status: EstadoSolucion;
  /** valor de cada variable (0 si ausente). */
  variables: Map<string, number>;
};
