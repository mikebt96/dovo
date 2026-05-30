import { describe, it, expect } from "vitest";
import { calcularKcal, factorIntensidad } from "@/lib/scoring/kcal";
import type { ActividadScoring, PerfilScoring } from "@/lib/scoring/types";

const gym: ActividadScoring = { slug: "gym", kcal_por_min: 6, stats_primary: ["FUE"], stats_secondary: ["VEL", "VIT"] };
const ballet: ActividadScoring = { slug: "ballet", kcal_por_min: 6.5, stats_primary: ["FLEX", "EQU"], stats_secondary: ["RES"] };
const running: ActividadScoring = { slug: "running", kcal_por_min: 10, stats_primary: ["RES"], stats_secondary: ["VEL"] };
const p70: PerfilScoring = { peso_kg: 70, bmr: 1600 };

describe("factorIntensidad", () => {
  it("intensidad 1 → 0.6, 5 → 1.4", () => {
    expect(factorIntensidad(ballet, { intensidad: 1 })).toBeCloseTo(0.6);
    expect(factorIntensidad(ballet, { intensidad: 5 })).toBeCloseTo(1.4);
  });
  it("sin intensidad → 1.0", () => {
    expect(factorIntensidad(gym, {})).toBe(1.0);
    expect(factorIntensidad(running, { distancia_km: 5, tiempo_min: 30 })).toBe(1.0);
  });
});

describe("calcularKcal", () => {
  it("gym 70kg 60min → 6*60*1*1 = 360", () => {
    expect(calcularKcal(gym, { peso_kg: 80, reps: 10, sets: 4 }, p70, 60)).toBeCloseTo(360);
  });
  it("escala por peso real", () => {
    expect(calcularKcal(gym, {}, { peso_kg: 140, bmr: 1800 }, 60)).toBeCloseTo(720);
  });
  it("running usa tiempo_min de las métricas como duración", () => {
    // 10 * 30 * 1 * 1
    expect(calcularKcal(running, { distancia_km: 5, tiempo_min: 30 }, p70, 0)).toBeCloseTo(300);
  });
  it("ballet aplica intensidad", () => {
    // 6.5 * 40 * 1 * 1.4
    expect(calcularKcal(ballet, { tiempo_min: 40, intensidad: 5 }, p70, 40)).toBeCloseTo(364);
  });
  it("duración 0 o NaN → 0 kcal", () => {
    expect(calcularKcal(gym, {}, p70, 0)).toBe(0);
  });
});
