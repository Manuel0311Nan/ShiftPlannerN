import { describe, expect, it } from "vitest";
import {
  bloquesDeHoy,
  diaSemanaDe,
  franjaDe,
  horasPorDia,
  horasProgramadas,
  turnosAbiertos,
  type BloquePlantillaResumen,
  type TurnoDelPeriodo,
} from "@/domains/scheduling/domain/resumen-dashboard";

// Semana de referencia: lunes 2026-08-24 … domingo 2026-08-30 (hora local).
const LUNES = new Date(2026, 7, 24);
const MARTES = new Date(2026, 7, 25);

function turno(
  dia: Date,
  horaInicio: number,
  horaFin: number,
  usuarioNombre = "María",
): TurnoDelPeriodo {
  const inicio = new Date(dia);
  inicio.setHours(horaInicio, 0, 0, 0);
  const fin = new Date(dia);
  fin.setHours(horaFin, 0, 0, 0);
  return { usuarioId: usuarioNombre, usuarioNombre, inicio, fin };
}

const bloqueManana: BloquePlantillaResumen = {
  localNombre: "Centro",
  diaSemana: "LUNES",
  nombre: "Apertura",
  horaInicio: "09:00",
  horaFin: "13:00",
  personasRequeridas: 2,
};

describe("diaSemanaDe", () => {
  it("diaSemanaDe_Domingo_DevuelveDomingoNoLunes", () => {
    // getDay() del domingo es 0; sin el desplazamiento caería en LUNES.
    expect(diaSemanaDe(new Date(2026, 7, 30))).toBe("DOMINGO");
  });

  it("diaSemanaDe_Lunes_DevuelveLunes", () => {
    expect(diaSemanaDe(LUNES)).toBe("LUNES");
  });
});

describe("franjaDe", () => {
  it("franjaDe_HorasLimite_RespetaCortes12y20", () => {
    expect(franjaDe("11:59")).toBe("MANANA");
    expect(franjaDe("12:00")).toBe("TARDE");
    expect(franjaDe("19:59")).toBe("TARDE");
    expect(franjaDe("20:00")).toBe("NOCHE");
  });
});

describe("horasProgramadas", () => {
  it("horasProgramadas_VariosTurnos_SumaDuraciones", () => {
    expect(horasProgramadas([turno(LUNES, 9, 13), turno(MARTES, 16, 20)])).toBe(8);
  });

  it("horasProgramadas_SinTurnos_EsCero", () => {
    expect(horasProgramadas([])).toBe(0);
  });
});

describe("horasPorDia", () => {
  it("horasPorDia_SiempreDevuelveLosSieteDias", () => {
    const barras = horasPorDia([turno(LUNES, 9, 13)], LUNES);
    expect(barras).toHaveLength(7);
    expect(barras.map((b) => b.dia)[6]).toBe("DOMINGO");
  });

  it("horasPorDia_DiaDeMasCarga_EsElCienPorCien", () => {
    const barras = horasPorDia(
      [turno(LUNES, 9, 13), turno(MARTES, 9, 17)],
      LUNES,
    );
    expect(barras[0]).toMatchObject({ dia: "LUNES", horas: 4, pct: 50, esHoy: true });
    expect(barras[1]).toMatchObject({ dia: "MARTES", horas: 8, pct: 100, esHoy: false });
  });

  it("horasPorDia_SemanaVacia_NoDivideEntreCero", () => {
    const barras = horasPorDia([], LUNES);
    expect(barras.every((b) => b.pct === 0 && b.horas === 0)).toBe(true);
  });
});

describe("bloquesDeHoy", () => {
  it("bloquesDeHoy_TurnoQueCasaConLaPlantilla_AgrupaConCobertura", () => {
    const bloques = bloquesDeHoy(
      [turno(LUNES, 9, 13, "María"), turno(LUNES, 9, 13, "Jorge")],
      [bloqueManana],
      LUNES,
    );
    expect(bloques).toHaveLength(1);
    expect(bloques[0]).toMatchObject({
      titulo: "Apertura",
      localNombre: "Centro",
      requeridas: 2,
      asignados: ["María", "Jorge"],
      franja: "MANANA",
    });
  });

  it("bloquesDeHoy_BloqueSinNadieAsignado_SeMuestraVacio", () => {
    const bloques = bloquesDeHoy([], [bloqueManana], LUNES);
    expect(bloques[0]).toMatchObject({ asignados: [], requeridas: 2 });
  });

  it("bloquesDeHoy_TurnoManualFueraDePlantilla_ApareceSinRequeridas", () => {
    const bloques = bloquesDeHoy([turno(LUNES, 22, 23)], [bloqueManana], LUNES);
    const nocturno = bloques.find((b) => b.horaInicio === "22:00");
    expect(nocturno).toMatchObject({ titulo: null, requeridas: null, franja: "NOCHE" });
  });

  it("bloquesDeHoy_TurnosDeOtroDia_SeIgnoran", () => {
    const bloques = bloquesDeHoy([turno(MARTES, 9, 13)], [], LUNES);
    expect(bloques).toHaveLength(0);
  });

  it("bloquesDeHoy_VariosHorarios_OrdenadosPorHoraDeInicio", () => {
    const bloques = bloquesDeHoy(
      [turno(LUNES, 16, 20), turno(LUNES, 9, 13)],
      [],
      LUNES,
    );
    expect(bloques.map((b) => b.horaInicio)).toEqual(["09:00", "16:00"]);
  });
});

describe("turnosAbiertos", () => {
  it("turnosAbiertos_CoberturaParcial_CuentaLasPlazasQueFaltan", () => {
    expect(turnosAbiertos([turno(LUNES, 9, 13)], [bloqueManana])).toBe(1);
  });

  it("turnosAbiertos_BloqueCubierto_NoCuenta", () => {
    const turnos = [turno(LUNES, 9, 13, "María"), turno(LUNES, 9, 13, "Jorge")];
    expect(turnosAbiertos(turnos, [bloqueManana])).toBe(0);
  });

  it("turnosAbiertos_ExcedenteEnUnBloque_NoTapaElDeficitDeOtro", () => {
    const martesTarde: BloquePlantillaResumen = {
      ...bloqueManana,
      diaSemana: "MARTES",
      nombre: "Cierre",
      horaInicio: "16:00",
      horaFin: "20:00",
      personasRequeridas: 1,
    };
    // Lunes sobrecubierto (3 de 2), martes sin nadie → sigue faltando 1.
    const turnos = [
      turno(LUNES, 9, 13, "María"),
      turno(LUNES, 9, 13, "Jorge"),
      turno(LUNES, 9, 13, "Sara"),
    ];
    expect(turnosAbiertos(turnos, [bloqueManana, martesTarde])).toBe(1);
  });

  it("turnosAbiertos_TurnoEnHorarioNoPlanificado_NoCubreNingunBloque", () => {
    expect(turnosAbiertos([turno(LUNES, 14, 18)], [bloqueManana])).toBe(2);
  });
});
