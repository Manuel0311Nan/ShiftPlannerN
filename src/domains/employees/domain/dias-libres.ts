import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";

/** Días de una semana. El motor nunca puede exigir más libranza que esto. */
export const DIAS_POR_SEMANA = 7;

/**
 * Máximo de días de libranza que un manager puede fijar por trabajador. Se deja
 * en 6 (al menos un día trabajado) para no crear un contrato imposible de
 * cumplir; el caso normal es 1–2.
 */
export const MAX_DIAS_LIBRES = 6;

/**
 * Valida los días de libranza semanales obligatorios de un trabajador: entero
 * entre 0 y {@link MAX_DIAS_LIBRES}. En el motor se traduce en un tope de días
 * trabajados por semana (`DIAS_POR_SEMANA - diasLibres`).
 */
export function crearDiasLibres(valor: number): Result<number> {
  if (!Number.isInteger(valor) || valor < 0 || valor > MAX_DIAS_LIBRES) {
    return fail(
      new DomainError(
        `Los días de libranza deben ser un entero entre 0 y ${MAX_DIAS_LIBRES}`,
        "DIAS_LIBRES_INVALIDO",
      ),
    );
  }
  return ok(valor);
}
