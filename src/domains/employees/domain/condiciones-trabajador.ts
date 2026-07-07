import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";
import { esTipoTurno, type TipoTurno } from "@/shared/kernel/tipo-turno";

/** Mínimo semanal de turnos de un tipo que el horario generado debe cumplir. */
export type CondicionTrabajador = { tipo: TipoTurno; minimo: number };

/**
 * Valida y normaliza el conjunto de condiciones de un trabajador. Un mínimo 0
 * equivale a "sin condición" y se descarta, de modo que solo se persisten
 * condiciones con valor. No se admiten tipos repetidos ni mínimos negativos o
 * no enteros.
 */
export function crearCondiciones(
  entradas: { tipo: string; minimo: number }[],
): Result<CondicionTrabajador[]> {
  const vistos = new Set<TipoTurno>();
  const condiciones: CondicionTrabajador[] = [];

  for (const entrada of entradas) {
    if (!esTipoTurno(entrada.tipo)) {
      return fail(
        new DomainError("Tipo de turno inválido", "CONDICION_TIPO_INVALIDO"),
      );
    }
    if (!Number.isInteger(entrada.minimo) || entrada.minimo < 0) {
      return fail(
        new DomainError(
          "El mínimo debe ser un entero mayor o igual que 0",
          "CONDICION_MINIMO_INVALIDO",
        ),
      );
    }
    if (vistos.has(entrada.tipo)) {
      return fail(
        new DomainError(
          "No puede haber dos condiciones del mismo tipo",
          "CONDICION_TIPO_DUPLICADO",
        ),
      );
    }
    vistos.add(entrada.tipo);
    if (entrada.minimo > 0) {
      condiciones.push({ tipo: entrada.tipo, minimo: entrada.minimo });
    }
  }

  return ok(condiciones);
}
