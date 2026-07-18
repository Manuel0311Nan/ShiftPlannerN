import { describe, expect, it } from "vitest";
import { YalpsScheduleSolver } from "@/domains/scheduling/infrastructure/yalps-solver";
import {
  construirModelo,
  construirModeloElastico,
  interpretarSolucion,
  type EmpleadoOptimizacion,
} from "@/domains/scheduling/domain/generar-asignaciones-ilp";
import type { BloqueRequerido } from "@/domains/scheduling/domain/generar-asignaciones";
import {
  cumpleCondiciones,
  rolesPorDia,
  type BloqueTiempo,
} from "@/domains/scheduling/domain/tipos-turno";

const DIAS = ["LUNES", "MARTES", "MIERCOLES"] as const;

function semana(): BloqueRequerido[] {
  const bloques: BloqueRequerido[] = [];
  for (const dia of DIAS) {
    bloques.push({ id: `${dia}_m`, nombre: "Mañana", diaSemana: dia, horaInicio: "09:00", horaFin: "14:00", personasRequeridas: 1 });
    bloques.push({ id: `${dia}_t`, nombre: "Tarde", diaSemana: dia, horaInicio: "16:00", horaFin: "21:00", personasRequeridas: 1 });
  }
  return bloques;
}

const solver = new YalpsScheduleSolver();

describe("YalpsScheduleSolver (integración con el modelo)", () => {
  it("resolver_CondicionesFactibles_CumpleLosMinimos", () => {
    const bloques = semana();
    const ana: EmpleadoOptimizacion = {
      id: "ana",
      disponibilidad: DIAS.map((dia) => ({ diaSemana: dia, horaInicio: "00:00", horaFin: "23:59" })),
      condiciones: [
        { tipo: "CIERRE", minimo: 2 },
        { tipo: "APERTURA", minimo: 1 },
        { tipo: "PARTIDO", minimo: 1 },
      ],
      // 30h = las 6 franjas de la semana; da margen de sobra a las condiciones.
      horasContrato: 30,
    };

    const { modelo, meta } = construirModelo({ bloques, empleados: [ana] });
    const solucion = solver.resolver(modelo);
    expect(solucion.status).toBe("optimal");

    const { asignaciones } = interpretarSolucion(solucion, meta);
    const roles = rolesPorDia(bloques);
    const asignadosAna: BloqueTiempo[] = asignaciones
      .filter((a) => a.usuarioId === "ana")
      .map((a) => bloques.find((b) => b.id === a.bloqueId)!);

    const { cumple } = cumpleCondiciones(asignadosAna, roles, ana.condiciones);
    expect(cumple).toBe(true);
  });

  it("resolver_CondicionImposible_InfeasibleYElasticoReportaDeficit", () => {
    const bloques = semana();
    // Solo mañanas → no puede hacer ningún cierre (tarde 16-21).
    const beto: EmpleadoOptimizacion = {
      id: "beto",
      disponibilidad: DIAS.map((dia) => ({ diaSemana: dia, horaInicio: "08:00", horaFin: "15:00" })),
      condiciones: [{ tipo: "CIERRE", minimo: 2 }],
      // 15h = las 3 mañanas; la única infactibilidad viene del CIERRE.
      horasContrato: 15,
    };

    const duro = construirModelo({ bloques, empleados: [beto] });
    expect(solver.resolver(duro.modelo).status).toBe("infeasible");

    const elastico = construirModeloElastico({ bloques, empleados: [beto] });
    const diag = solver.resolver(elastico.modelo);
    expect(diag.status).toBe("optimal");
    const { deficits } = interpretarSolucion(diag, elastico.meta);
    expect(deficits).toEqual([{ usuarioId: "beto", tipo: "CIERRE", faltan: 2 }]);
  });
});
