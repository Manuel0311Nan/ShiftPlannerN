import { solve, type Model } from "yalps";
import type { ScheduleSolver } from "@/domains/scheduling/application/ports/schedule-solver.port";
import type {
  EstadoSolucion,
  ModeloILP,
  SolucionILP,
} from "@/domains/scheduling/domain/modelo-ilp";

/**
 * Adaptador del puerto `ScheduleSolver` sobre `yalps` (ILP en JS puro). Único
 * punto que conoce la librería; traduce el modelo neutro y su resultado.
 */
/**
 * Tope de tiempo (ms) para el branch-and-bound. Un ILP con muchas binarias
 * (trabajadores × bloques × días) puede crecer mucho; sin tope, `solve` podría
 * no terminar y dejar la generación colgada. Al superarlo, yalps devuelve
 * `status: "timedout"` y lo propagamos como error controlado.
 */
const SOLVER_TIMEOUT_MS = 10_000;

export class YalpsScheduleSolver implements ScheduleSolver {
  resolver(modelo: ModeloILP): SolucionILP {
    const model: Model = {
      direction: modelo.objetivo === "maximizar" ? "maximize" : "minimize",
      objective: modelo.nombreObjetivo,
      constraints: modelo.restricciones,
      variables: modelo.variables,
      integers: modelo.enteras,
      binaries: modelo.binarias,
    };

    const solucion = solve(model, { timeout: SOLVER_TIMEOUT_MS });

    const status: EstadoSolucion =
      solucion.status === "optimal"
        ? "optimal"
        : solucion.status === "infeasible"
          ? "infeasible"
          : solucion.status === "timedout"
            ? "timedout"
            : "otro";

    return { status, variables: new Map(solucion.variables) };
  }
}
