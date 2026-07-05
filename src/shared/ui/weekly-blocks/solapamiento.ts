export function minutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function seSuperponen(
  a: { horaInicio: string; horaFin: string },
  b: { horaInicio: string; horaFin: string },
): boolean {
  return minutos(a.horaInicio) < minutos(b.horaFin) && minutos(b.horaInicio) < minutos(a.horaFin);
}
