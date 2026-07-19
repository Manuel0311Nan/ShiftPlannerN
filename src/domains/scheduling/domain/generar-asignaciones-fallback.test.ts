import { describe, expect, it } from "vitest";
import { generarAsignacionesFallback } from "@/domains/scheduling/domain/generar-asignaciones-fallback";
import type { BloqueRequerido } from "@/domains/scheduling/domain/generar-asignaciones";
import type { EmpleadoOptimizacion } from "@/domains/scheduling/domain/generar-asignaciones-ilp";

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"] as const;

function plantilla(): BloqueRequerido[] {
  return DIAS.map((dia) => ({
    id: `${dia}_m`,
    nombre: "Mañana",
    diaSemana: dia,
    horaInicio: "09:00",
    horaFin: "14:00", // 5h
    personasRequeridas: 1,
  }));
}

const todoElDia = (dias: readonly (typeof DIAS)[number][]) =>
  dias.map((dia) => ({ diaSemana: dia, horaInicio: "00:00", horaFin: "23:59" }));

describe("generarAsignacionesFallback", () => {
  it("fallback_RespetaTopeDeHoras", () => {
    // Contrato 10h con bloques de 5h: como mucho 2 turnos, aunque haya 5 días.
    const ana: EmpleadoOptimizacion = {
      id: "ana",
      disponibilidad: todoElDia(DIAS),
      condiciones: [],
      horasContrato: 10,
      diasLibres: 0,
    };
    const { asignaciones, huecos } = generarAsignacionesFallback(plantilla(), [ana], {
      permitirHorasExtra: false,
    });
    expect(asignaciones.length).toBe(2);
    expect(huecos.reduce((s, h) => s + h.faltan, 0)).toBe(3);
  });

  it("fallback_RespetaDiasDeLibranza", () => {
    // 40h de contrato daría para los 5 días, pero con 3 días libres (tope 4)
    // solo puede trabajar 4 días como máximo… y con bloques de 5h, 4 turnos.
    const ana: EmpleadoOptimizacion = {
      id: "ana",
      disponibilidad: todoElDia(DIAS),
      condiciones: [],
      horasContrato: 40,
      diasLibres: 3,
    };
    const { asignaciones } = generarAsignacionesFallback(plantilla(), [ana], {
      permitirHorasExtra: false,
    });
    const dias = new Set(
      asignaciones.map((a) => a.bloqueId.replace("_m", "")),
    );
    expect(dias.size).toBeLessThanOrEqual(4);
  });

  it("fallback_SinNadieDisponible_ReportaHuecos", () => {
    const { asignaciones, huecos } = generarAsignacionesFallback(plantilla(), [], {
      permitirHorasExtra: false,
    });
    expect(asignaciones).toEqual([]);
    expect(huecos.length).toBe(5);
  });
});
