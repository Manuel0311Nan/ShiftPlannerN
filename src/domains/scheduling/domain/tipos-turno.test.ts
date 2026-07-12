import { describe, expect, it } from "vitest";
import {
  clasificarDia,
  contarTipos,
  cumpleCondiciones,
  rolesPorDia,
  type BloqueTiempo,
} from "@/domains/scheduling/domain/tipos-turno";

// Plantilla de un día "partido": mañana (apertura) + tarde (cierre).
const manana: BloqueTiempo = { id: "L_m", diaSemana: "LUNES", horaInicio: "09:00", horaFin: "13:00" };
const tarde: BloqueTiempo = { id: "L_t", diaSemana: "LUNES", horaInicio: "16:00", horaFin: "20:00" };
const noche: BloqueTiempo = { id: "L_n", diaSemana: "LUNES", horaInicio: "20:00", horaFin: "23:00" };

describe("rolesPorDia", () => {
  it("rolesPorDia_VariosBloques_AperturaEsPrimeroCierreEsUltimo", () => {
    const roles = rolesPorDia([tarde, manana, noche]);
    expect(roles.get("LUNES")).toEqual({ aperturaId: "L_m", cierreId: "L_n" });
  });

  it("rolesPorDia_UnSoloBloque_EsAperturaYCierre", () => {
    const roles = rolesPorDia([manana]);
    expect(roles.get("LUNES")).toEqual({ aperturaId: "L_m", cierreId: "L_m" });
  });
});

describe("clasificarDia", () => {
  it("clasificarDia_PartidoQueIncluyeCierre_CuentaPartidoYCierre", () => {
    // Trabaja 13-16 (no es apertura) y 20-23 (cierre) → partido + cierre, no apertura.
    const roles = rolesPorDia([manana, tarde, noche]).get("LUNES");
    const bloques: BloqueTiempo[] = [
      { id: "L_x", diaSemana: "LUNES", horaInicio: "13:00", horaFin: "16:00" },
      noche,
    ];
    expect(clasificarDia(bloques, roles)).toEqual({
      apertura: false,
      cierre: true,
      partido: true,
    });
  });

  it("clasificarDia_UnBloqueApertura_SoloApertura", () => {
    const roles = rolesPorDia([manana, tarde]).get("LUNES");
    expect(clasificarDia([manana], roles)).toEqual({
      apertura: true,
      cierre: false,
      partido: false,
    });
  });
});

describe("cumpleCondiciones", () => {
  const semana: BloqueTiempo[] = [
    { id: "L_t", diaSemana: "LUNES", horaInicio: "16:00", horaFin: "21:00" },
    { id: "M_t", diaSemana: "MARTES", horaInicio: "16:00", horaFin: "21:00" },
    { id: "X_t", diaSemana: "MIERCOLES", horaInicio: "16:00", horaFin: "21:00" },
  ];
  // roles: cada día tiene solo ese bloque → es apertura y cierre.
  const roles = rolesPorDia(semana);

  it("cumpleCondiciones_CumpleMinimoCierres_CumpleSinDeficit", () => {
    const res = cumpleCondiciones(semana, roles, [{ tipo: "CIERRE", minimo: 3 }]);
    expect(res.cumple).toBe(true);
    expect(res.deficit).toEqual([]);
  });

  it("cumpleCondiciones_FaltanPartidos_ReportaDeficit", () => {
    const res = cumpleCondiciones(semana, roles, [
      { tipo: "CIERRE", minimo: 3 },
      { tipo: "PARTIDO", minimo: 1 },
    ]);
    expect(res.cumple).toBe(false);
    expect(res.deficit).toEqual([{ tipo: "PARTIDO", faltan: 1 }]);
  });

  it("contarTipos_TresCierresQueSonTambienAperturas_CuentaAmbos", () => {
    // Bloques únicos por día ⇒ cada uno es apertura y cierre.
    expect(contarTipos(semana, roles)).toEqual({ APERTURA: 3, CIERRE: 3, PARTIDO: 0 });
  });
});
