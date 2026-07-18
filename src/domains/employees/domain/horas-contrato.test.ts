import { describe, expect, it } from "vitest";
import { crearHorasContrato } from "@/domains/employees/domain/horas-contrato";

describe("crearHorasContrato", () => {
  it("crearHorasContrato_DentroDeRango_DevuelveElValor", () => {
    const res = crearHorasContrato(20);
    expect(res.success).toBe(true);
    if (res.success) expect(res.value).toBe(20);
  });

  it("crearHorasContrato_MaximoLegal_EsValido", () => {
    const res = crearHorasContrato(40);
    expect(res.success).toBe(true);
  });

  it("crearHorasContrato_PorEncimaDelMaximo_DevuelveError", () => {
    const res = crearHorasContrato(41);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe("HORAS_CONTRATO_INVALIDO");
  });

  it("crearHorasContrato_Cero_DevuelveError", () => {
    const res = crearHorasContrato(0);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe("HORAS_CONTRATO_INVALIDO");
  });

  it("crearHorasContrato_NoEntero_DevuelveError", () => {
    const res = crearHorasContrato(20.5);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe("HORAS_CONTRATO_INVALIDO");
  });
});
