import { describe, it, expect } from "vitest";
import { distribuirStats } from "@/lib/scoring/stats";
import type { ActividadScoring } from "@/lib/scoring/types";

const gym: ActividadScoring = { slug: "gym", kcal_por_min: 6, stats_primary: ["FUE"], stats_secondary: ["VEL", "VIT"] };
const ballet: ActividadScoring = { slug: "ballet", kcal_por_min: 6.5, stats_primary: ["FLEX", "EQU"], stats_secondary: ["RES"] };

describe("distribuirStats", () => {
  it("gym: FUE += puntos, VEL/VIT += puntos*0.4", () => {
    const d = distribuirStats(100, gym);
    expect(d.fue).toBe(100);
    expect(d.vel).toBe(40);
    expect(d.vit).toBe(40);
    expect(d.res).toBe(0);
  });
  it("ballet: FLEX y EQU primarias, RES secundaria", () => {
    const d = distribuirStats(50, ballet);
    expect(d.flex).toBe(50);
    expect(d.equ).toBe(50);
    expect(d.res).toBe(20);
  });
});
