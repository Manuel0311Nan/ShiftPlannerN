import { DomainError, fail, ok, type Result } from "@/shared/kernel/result";

/** Máximo legal de horas semanales que puede trabajar un empleado. */
export const MAX_HORAS_SEMANALES = 40;

/**
 * Valida las horas semanales contratadas de un trabajador: entero entre 1 y el
 * máximo legal. Es el mínimo que el horario generado intenta cumplir y, salvo
 * horas extra, también el tope de horas asignadas.
 */
export function crearHorasContrato(valor: number): Result<number> {
  if (!Number.isInteger(valor) || valor < 1 || valor > MAX_HORAS_SEMANALES) {
    return fail(
      new DomainError(
        `Las horas de contrato deben ser un entero entre 1 y ${MAX_HORAS_SEMANALES}`,
        "HORAS_CONTRATO_INVALIDO",
      ),
    );
  }
  return ok(valor);
}
