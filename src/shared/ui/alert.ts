import Swal, { type SweetAlertOptions } from "sweetalert2";

/**
 * Wrapper de SweetAlert2 con el tema del design system. Centraliza colores y
 * textos por defecto para que todos los mensajes de confirmación/feedback se
 * vean igual. Usa las CSS variables definidas en `globals.css`, así respeta el
 * modo claro/oscuro automáticamente.
 */
const base: SweetAlertOptions = {
  background: "var(--surface-raised)",
  color: "var(--ink)",
  confirmButtonColor: "var(--primary)",
  cancelButtonColor: "var(--muted-foreground)",
  buttonsStyling: true,
};

/** Toast de éxito, no bloqueante, en la esquina superior. */
export function toastExito(titulo: string) {
  return Swal.fire({
    ...base,
    toast: true,
    position: "top-end",
    icon: "success",
    title: titulo,
    showConfirmButton: false,
    timer: 2600,
    timerProgressBar: true,
  });
}

/** Alerta de error bloqueante con botón de cierre. */
export function alertaError(mensaje: string, titulo = "Algo salió mal") {
  return Swal.fire({
    ...base,
    icon: "error",
    title: titulo,
    text: mensaje,
    confirmButtonText: "Entendido",
  });
}

/**
 * Diálogo de confirmación (sí/no). Devuelve `true` si el usuario confirma.
 */
export async function confirmar({
  titulo,
  texto,
  confirmar = "Confirmar",
  cancelar = "Cancelar",
  peligro = false,
}: {
  titulo: string;
  texto?: string;
  confirmar?: string;
  cancelar?: string;
  peligro?: boolean;
}): Promise<boolean> {
  const result = await Swal.fire({
    ...base,
    icon: peligro ? "warning" : "question",
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: confirmar,
    cancelButtonText: cancelar,
    confirmButtonColor: peligro ? "var(--destructive)" : "var(--primary)",
    reverseButtons: true,
    focusCancel: peligro,
  });
  return result.isConfirmed;
}
