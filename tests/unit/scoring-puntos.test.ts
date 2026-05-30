import { describe, it, expect } from "vitest";
import { calcularPuntos } from "@/lib/scoring/puntos";

describe("calcularPuntos", () => {
  it("normaliza kcal por minuto-basal: 360 kcal, bmr 1440 → 360", () => {
    // basal/min = 1440/1440 = 1 → puntos = 360/1 = 360
    expect(calcularPuntos(360, 1440)).toBe(360);
  });
  it("bmr más alto → menos puntos por las mismas kcal", () => {
    // basal/min = 2880/1440 = 2 → 360/2 = 180
    expect(calcularPuntos(360, 2880)).toBe(180);
  });
  it("bmr inválido → 0", () => {
    expect(calcularPuntos(360, 0)).toBe(0);
  });
});
