import { describe, it, expect } from "vitest";
import { calcularCheckin } from "@/lib/scoring";
import type { ActividadScoring, PerfilScoring } from "@/lib/scoring";

const gym: ActividadScoring = { slug: "gym", kcal_por_min: 6, stats_primary: ["FUE"], stats_secondary: ["VEL", "VIT"] };
const perfil: PerfilScoring = { peso_kg: 70, bmr: 1440 };

describe("calcularCheckin", () => {
  it("encadena kcal→puntos→deltas, determinista", () => {
    const r = calcularCheckin(gym, { peso_kg: 80, reps: 10, sets: 4 }, perfil, 60);
    expect(r.kcal).toBeCloseTo(360);
    expect(r.puntos).toBe(360); // 360 / (1440/1440)
    expect(r.deltas.fue).toBe(360);
    expect(r.deltas.vel).toBe(144); // 360*0.4
  });
});
