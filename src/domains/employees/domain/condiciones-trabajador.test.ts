import { describe, expect, it } from "vitest";
import { crearCondiciones } from "@/domains/employees/domain/condiciones-trabajador";

describe("crearCondiciones", () => {
  it("crearCondiciones_TiposValidos_NormalizaYDescartaCeros", () => {
    const res = crearCondiciones([
      { tipo: "CIERRE", minimo: 3 },
      { tipo: "PARTIDO", minimo: 1 },
      { tipo: "APERTURA", minimo: 0 },
    ]);

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.value).toEqual([
        { tipo: "CIERRE", minimo: 3 },
        { tipo: "PARTIDO", minimo: 1 },
      ]);
    }
  });

  it("crearCondiciones_TipoInvalido_DevuelveError", () => {
    const res = crearCondiciones([{ tipo: "NOCHE", minimo: 2 }]);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe("CONDICION_TIPO_INVALIDO");
  });

  it("crearCondiciones_MinimoNegativo_DevuelveError", () => {
    const res = crearCondiciones([{ tipo: "CIERRE", minimo: -1 }]);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe("CONDICION_MINIMO_INVALIDO");
  });

  it("crearCondiciones_MinimoNoEntero_DevuelveError", () => {
    const res = crearCondiciones([{ tipo: "CIERRE", minimo: 1.5 }]);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe("CONDICION_MINIMO_INVALIDO");
  });

  it("crearCondiciones_TipoDuplicado_DevuelveError", () => {
    const res = crearCondiciones([
      { tipo: "CIERRE", minimo: 2 },
      { tipo: "CIERRE", minimo: 3 },
    ]);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe("CONDICION_TIPO_DUPLICADO");
  });

  it("crearCondiciones_TodoCeros_DevuelveListaVacia", () => {
    const res = crearCondiciones([
      { tipo: "CIERRE", minimo: 0 },
      { tipo: "APERTURA", minimo: 0 },
    ]);
    expect(res.success).toBe(true);
    if (res.success) expect(res.value).toEqual([]);
  });
});
