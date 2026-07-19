import { describe, expect, it } from "vitest";
import {
  crearSolicitudDisponibilidad,
  DIAS_ANTELACION_SOLICITUD,
} from "@/domains/employees/domain/solicitud-disponibilidad";

const ahora = new Date(2026, 6, 1); // 1 jul 2026
const semanaLejana = new Date(2026, 6, 1 + DIAS_ANTELACION_SOLICITUD + 1);
const semanaCercana = new Date(2026, 6, 1 + DIAS_ANTELACION_SOLICITUD - 1);

describe("crearSolicitudDisponibilidad", () => {
  it("crearSolicitud_ConAntelacionYMotivo_Valida", () => {
    const result = crearSolicitudDisponibilidad({
      semanaInicio: semanaLejana,
      motivo: "  Cita médica el miércoles  ",
      ahora,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.value.motivo).toBe("Cita médica el miércoles");
  });

  it("crearSolicitud_SinAntelacionSuficiente_Falla", () => {
    const result = crearSolicitudDisponibilidad({
      semanaInicio: semanaCercana,
      motivo: "Cambio",
      ahora,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("SOLICITUD_FUERA_DE_PLAZO");
  });

  it("crearSolicitud_MotivoVacio_Falla", () => {
    const result = crearSolicitudDisponibilidad({
      semanaInicio: semanaLejana,
      motivo: "  ",
      ahora,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("SOLICITUD_MOTIVO_VACIO");
  });
});
