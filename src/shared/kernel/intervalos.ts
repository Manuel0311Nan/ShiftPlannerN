/**
 * Intervalos horarios de un mismo día, expresados como "HH:MM" y operados en
 * minutos desde medianoche.
 *
 * Existe porque varias reglas del producto necesitan razonar sobre la **unión**
 * de varios intervalos, no sobre cada uno por separado: quien declara estar
 * disponible de 09:00 a 14:00 y de 14:00 a 22:00 está disponible de 09:00 a
 * 22:00, aunque ningún intervalo suelto cubra esa franja. Comprobar intervalo a
 * intervalo dejaba turnos sin cubrir sin motivo aparente.
 */

export type Intervalo = { horaInicio: string; horaFin: string };
export type RangoMinutos = { inicio: number; fin: number };

/** Minutos desde medianoche de una hora "HH:MM". */
export function minutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** Hora "HH:MM" a partir de minutos desde medianoche. */
export function hora(minutosDelDia: number): string {
  const h = String(Math.floor(minutosDelDia / 60)).padStart(2, "0");
  const m = String(minutosDelDia % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Fusiona intervalos en tramos disjuntos y ordenados. Los que solo se tocan en
 * el extremo (14:00 → 14:00) se unen en uno solo: entre ellos no hay corte real.
 */
export function fusionar(intervalos: Intervalo[]): RangoMinutos[] {
  const rangos = intervalos
    .map((i) => ({ inicio: minutos(i.horaInicio), fin: minutos(i.horaFin) }))
    .filter((r) => r.fin > r.inicio)
    .sort((a, b) => a.inicio - b.inicio);

  const fusionados: RangoMinutos[] = [];
  for (const rango of rangos) {
    const ultimo = fusionados[fusionados.length - 1];
    if (ultimo && rango.inicio <= ultimo.fin) {
      ultimo.fin = Math.max(ultimo.fin, rango.fin);
    } else {
      fusionados.push({ ...rango });
    }
  }
  return fusionados;
}

/** ¿La unión de `intervalos` cubre `rango` de principio a fin, sin cortes? */
export function unionCubre(intervalos: Intervalo[], rango: Intervalo): boolean {
  const inicio = minutos(rango.horaInicio);
  const fin = minutos(rango.horaFin);
  if (fin <= inicio) return false;
  return fusionar(intervalos).some((r) => r.inicio <= inicio && r.fin >= fin);
}

/** Minutos cubiertos por la unión: el tiempo solapado cuenta una sola vez. */
export function minutosCubiertos(intervalos: Intervalo[]): number {
  return fusionar(intervalos).reduce((total, r) => total + (r.fin - r.inicio), 0);
}

/**
 * Máximo de intervalos activos a la vez. Con solapes permitidos, es lo que de
 * verdad mide "cuánta gente hay en el local a la hora punta".
 */
export function maximoSimultaneo(
  intervalos: (Intervalo & { peso?: number })[],
): number {
  const eventos: { minuto: number; delta: number }[] = [];
  for (const i of intervalos) {
    const inicio = minutos(i.horaInicio);
    const fin = minutos(i.horaFin);
    if (fin <= inicio) continue;
    const peso = i.peso ?? 1;
    eventos.push({ minuto: inicio, delta: peso });
    eventos.push({ minuto: fin, delta: -peso });
  }
  // A igual minuto, primero las salidas: un turno que acaba a las 14:00 no
  // coincide con otro que empieza a las 14:00.
  eventos.sort((a, b) => a.minuto - b.minuto || a.delta - b.delta);

  let actual = 0;
  let maximo = 0;
  for (const evento of eventos) {
    actual += evento.delta;
    if (actual > maximo) maximo = actual;
  }
  return maximo;
}
