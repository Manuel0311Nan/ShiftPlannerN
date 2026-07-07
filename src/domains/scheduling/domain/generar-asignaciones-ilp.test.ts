import { describe, expect, it } from "vitest";
import {
  construirModelo,
  construirModeloElastico,
  interpretarSolucion,
  type EmpleadoOptimizacion,
} from "@/domains/scheduling/domain/generar-asignaciones-ilp";
import type { BloqueRequerido } from "@/domains/scheduling/domain/generar-asignaciones";
import type { SolucionILP } from "@/domains/scheduling/domain/modelo-ilp";

const bloque: BloqueRequerido = {
  id: "L_t",
  nombre: "Tarde",
  diaSemana: "LUNES",
  horaInicio: "16:00",
  horaFin: "21:00",
  personasRequeridas: 1,
};

const ana: EmpleadoOptimizacion = {
  id: "ana",
  disponibilidad: [{ diaSemana: "LUNES", horaInicio: "00:00", horaFin: "23:59" }],
  condiciones: [{ tipo: "CIERRE", minimo: 1 }],
};

describe("construirModelo", () => {
  it("construirModelo_ParDisponible_CreaVariableYCobertura", () => {
    const { modelo, meta } = construirModelo({ bloques: [bloque], empleados: [ana] });

    expect(modelo.variables["x__ana__L_t"]).toBeDefined();
    expect(modelo.binarias).toContain("x__ana__L_t");
    expect(modelo.restricciones["cov__L_t"]).toEqual({ max: 1 });
    expect(meta.asignaciones).toEqual([
      { variable: "x__ana__L_t", usuarioId: "ana", bloqueId: "L_t" },
    ]);
  });

  it("construirModelo_EmpleadoNoDisponible_NoCreaVariable", () => {
    const soloManana: EmpleadoOptimizacion = {
      id: "beto",
      disponibilidad: [{ diaSemana: "LUNES", horaInicio: "08:00", horaFin: "15:00" }],
      condiciones: [],
    };
    const { modelo } = construirModelo({ bloques: [bloque], empleados: [soloManana] });
    expect(modelo.variables["x__beto__L_t"]).toBeUndefined();
  });
});

describe("interpretarSolucion", () => {
  it("interpretarSolucion_VariableActiva_DevuelveAsignacionSinHuecos", () => {
    const { meta } = construirModelo({ bloques: [bloque], empleados: [ana] });
    const solucion: SolucionILP = {
      status: "optimal",
      variables: new Map([["x__ana__L_t", 1]]),
    };
    const { asignaciones, huecos } = interpretarSolucion(solucion, meta);
    expect(asignaciones).toEqual([{ usuarioId: "ana", bloqueId: "L_t" }]);
    expect(huecos).toEqual([]);
  });

  it("interpretarSolucion_SinAsignaciones_ReportaHueco", () => {
    const { meta } = construirModelo({ bloques: [bloque], empleados: [ana] });
    const solucion: SolucionILP = { status: "optimal", variables: new Map() };
    const { huecos } = interpretarSolucion(solucion, meta);
    expect(huecos).toEqual([{ bloqueId: "L_t", faltan: 1 }]);
  });

  it("interpretarSolucion_SlackConValor_ReportaDeficit", () => {
    const soloManana: EmpleadoOptimizacion = {
      id: "beto",
      disponibilidad: [{ diaSemana: "LUNES", horaInicio: "08:00", horaFin: "15:00" }],
      condiciones: [{ tipo: "CIERRE", minimo: 2 }],
    };
    const { meta } = construirModeloElastico({ bloques: [bloque], empleados: [soloManana] });
    const solucion: SolucionILP = {
      status: "optimal",
      variables: new Map([["slack__beto__CIERRE", 2]]),
    };
    const { deficits } = interpretarSolucion(solucion, meta);
    expect(deficits).toEqual([{ usuarioId: "beto", tipo: "CIERRE", faltan: 2 }]);
  });
});
