/**
 * Lunes a medianoche (hora local) de la semana en la que cae `fecha`.
 * Se usa como inicio de ventana para buscar turnos de la semana.
 */
export function inicioSemana(fecha: Date): Date {
  const inicio = new Date(fecha);
  const offset = (inicio.getDay() + 6) % 7; // días transcurridos desde el lunes
  inicio.setDate(inicio.getDate() - offset);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}
