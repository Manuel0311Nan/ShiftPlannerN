import {
  maximoSimultaneo,
  minutos,
  minutosCubiertos,
} from "@/shared/kernel/intervalos";

export { minutos };

type Franja = { horaInicio: string; horaFin: string };

export function seSuperponen(a: Franja, b: Franja): boolean {
  return minutos(a.horaInicio) < minutos(b.horaFin) && minutos(b.horaInicio) < minutos(a.horaFin);
}

/**
 * Horas de cobertura de un conjunto de bloques: el tiempo solapado cuenta una
 * sola vez. Sumar las duraciones sin más daba "16h" para un día que abre 9h.
 */
export function horasCubiertas(bloques: Franja[]): number {
  return minutosCubiertos(bloques) / 60;
}

/** Máximo de personas a la vez: la hora punta real del día. */
export function picoPersonas(
  bloques: (Franja & { personasRequeridas?: number })[],
): number {
  return maximoSimultaneo(
    bloques.map((b) => ({ ...b, peso: b.personasRequeridas ?? 1 })),
  );
}

/** Ids de los bloques que pisan a algún otro del mismo día. */
export function idsSolapados<T extends Franja & { id: string }>(
  bloques: T[],
): Set<string> {
  const solapados = new Set<string>();
  for (let i = 0; i < bloques.length; i++) {
    for (let j = i + 1; j < bloques.length; j++) {
      if (seSuperponen(bloques[i], bloques[j])) {
        solapados.add(bloques[i].id);
        solapados.add(bloques[j].id);
      }
    }
  }
  return solapados;
}
