import { describe, expect, it } from "vitest";
import {
  fusionar,
  hora,
  maximoSimultaneo,
  minutos,
  minutosCubiertos,
  unionCubre,
} from "@/shared/kernel/intervalos";

const franja = (horaInicio: string, horaFin: string) => ({ horaInicio, horaFin });

describe("minutos / hora", () => {
  it("Minutos_HoraConMedia_DevuelveMinutosDesdeMedianoche", () => {
    expect(minutos("09:30")).toBe(570);
  });

  it("Hora_MinutosDesdeMedianoche_DevuelveHHMM", () => {
    expect(hora(570)).toBe("09:30");
    expect(hora(0)).toBe("00:00");
  });
});

describe("fusionar", () => {
  it("Fusionar_IntervalosContiguos_DevuelveUnoSolo", () => {
    expect(fusionar([franja("09:00", "14:00"), franja("14:00", "22:00")])).toEqual([
      { inicio: 540, fin: 1320 },
    ]);
  });

  it("Fusionar_IntervalosSolapados_DevuelveLaEnvolvente", () => {
    expect(fusionar([franja("09:00", "14:00"), franja("12:00", "18:00")])).toEqual([
      { inicio: 540, fin: 1080 },
    ]);
  });

  it("Fusionar_IntervalosConHueco_LosMantieneSeparados", () => {
    expect(fusionar([franja("16:00", "21:00"), franja("09:00", "14:00")])).toEqual([
      { inicio: 540, fin: 840 },
      { inicio: 960, fin: 1260 },
    ]);
  });

  it("Fusionar_IntervaloDegenerado_LoDescarta", () => {
    expect(fusionar([franja("09:00", "09:00"), franja("14:00", "12:00")])).toEqual([]);
  });
});

describe("unionCubre", () => {
  it("UnionCubre_DisponibilidadPartidaContigua_CubreTurnoQueLaCruza", () => {
    // El caso que antes se reportaba como hueco sin explicación: nadie con dos
    // tramos contiguos podía cubrir un turno que empezara en uno y acabara en otro.
    const disponibilidad = [franja("09:00", "14:00"), franja("14:00", "22:00")];
    expect(unionCubre(disponibilidad, franja("12:00", "18:00"))).toBe(true);
  });

  it("UnionCubre_DisponibilidadConHueco_NoCubreTurnoQueLoAtraviesa", () => {
    const disponibilidad = [franja("09:00", "14:00"), franja("16:00", "22:00")];
    expect(unionCubre(disponibilidad, franja("12:00", "18:00"))).toBe(false);
  });

  it("UnionCubre_UnSoloIntervaloQueEnvuelve_Cubre", () => {
    expect(unionCubre([franja("08:00", "22:00")], franja("09:00", "14:00"))).toBe(true);
  });

  it("UnionCubre_TurnoQueSeSalePorElFinal_NoCubre", () => {
    expect(unionCubre([franja("09:00", "20:00")], franja("16:00", "21:00"))).toBe(false);
  });

  it("UnionCubre_SinDisponibilidad_NoCubre", () => {
    expect(unionCubre([], franja("09:00", "14:00"))).toBe(false);
  });

  it("UnionCubre_RangoDegenerado_NoCubre", () => {
    expect(unionCubre([franja("09:00", "22:00")], franja("14:00", "14:00"))).toBe(false);
  });
});

describe("minutosCubiertos", () => {
  it("MinutosCubiertos_BloquesSolapados_CuentaElTiempoUnaVez", () => {
    // 09:00-14:00 y 12:00-18:00 cubren 09:00-18:00 = 9h, no 11h.
    expect(minutosCubiertos([franja("09:00", "14:00"), franja("12:00", "18:00")])).toBe(540);
  });

  it("MinutosCubiertos_BloquesDisjuntos_SumaLosDos", () => {
    expect(minutosCubiertos([franja("09:00", "14:00"), franja("16:00", "21:00")])).toBe(600);
  });
});

describe("maximoSimultaneo", () => {
  it("MaximoSimultaneo_RefuerzoSobreMananaYTarde_DevuelveElPico", () => {
    // Mañana 2, tarde 2 y un refuerzo de 1 que cruza ambas: el pico son 3.
    const bloques = [
      { ...franja("09:00", "14:00"), peso: 2 },
      { ...franja("16:00", "21:00"), peso: 2 },
      { ...franja("12:00", "18:00"), peso: 1 },
    ];
    expect(maximoSimultaneo(bloques)).toBe(3);
  });

  it("MaximoSimultaneo_TurnosQueSeTocanEnElExtremo_NoCoinciden", () => {
    const bloques = [franja("09:00", "14:00"), franja("14:00", "21:00")];
    expect(maximoSimultaneo(bloques)).toBe(1);
  });

  it("MaximoSimultaneo_SinBloques_DevuelveCero", () => {
    expect(maximoSimultaneo([])).toBe(0);
  });
});
