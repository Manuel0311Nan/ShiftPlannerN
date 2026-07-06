import type { Result } from "@/shared/kernel/result";

/** Error de dominio aplanado a datos planos, seguro de cruzar a cliente. */
export type SerializableError = { message: string; code: string };

/**
 * Versión serializable de `Result<T>` para devolver desde Server Actions:
 * conserva la forma `success/value/error` pero sin instancias de `Error`
 * (que perderían el prototipo al cruzar el borde servidor→cliente).
 */
export type ActionResult<T> =
  | { success: true; value: T }
  | { success: false; error: SerializableError };

export function toActionResult<T>(result: Result<T>): ActionResult<T> {
  if (result.success) {
    return { success: true, value: result.value };
  }
  return {
    success: false,
    error: { message: result.error.message, code: result.error.code },
  };
}

export function actionError(message: string, code: string): ActionResult<never> {
  return { success: false, error: { message, code } };
}
