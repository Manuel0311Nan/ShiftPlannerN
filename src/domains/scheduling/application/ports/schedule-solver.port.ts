import type { ModeloILP, SolucionILP } from "@/domains/scheduling/domain/modelo-ilp";

/**
 * Resuelve un modelo ILP neutro. La implementación concreta (yalps) vive en
 * infraestructura; el use case depende solo de esta interfaz, de modo que el
 * solver es intercambiable y testeable con un fake.
 */
export interface ScheduleSolver {
  resolver(modelo: ModeloILP): SolucionILP;
}
