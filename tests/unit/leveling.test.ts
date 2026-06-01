import { describe, it, expect } from "vitest";
import {
  statDisplay,
  tierFor,
  nivelDesdeXp,
  xpDeNivel,
  className,
  characterSheet,
  type Stats,
} from "@/lib/leveling";

const zero: Stats = { fue: 0, res: 0, flex: 0, vel: 0, equ: 0, vit: 0 };
const only = (k: keyof Stats, v: number): Stats => ({ ...zero, [k]: v });
const flat = (v: number): Stats => ({ fue: v, res: v, flex: v, vel: v, equ: v, vit: v });

describe("statDisplay", () => {
  it("0 y valores muy bajos → 0", () => {
    expect(statDisplay(0)).toBe(0);
    expect(statDisplay(9)).toBe(0);
  });
  it("es monótono creciente", () => {
    expect(statDisplay(100)).toBeGreaterThan(statDisplay(50));
    expect(statDisplay(10000)).toBeGreaterThan(statDisplay(1000));
  });
  it("mapea a los tiers esperados del spec", () => {
    expect(tierFor(statDisplay(95)).name).toBe("Apprentice"); // ~25
    expect(tierFor(statDisplay(900)).name).toBe("Athlete"); // ~50
    expect(tierFor(statDisplay(10000)).name).toBe("Expert"); // ~78
  });
});

describe("tierFor", () => {
  it("respeta los umbrales", () => {
    expect(tierFor(0).name).toBe("Rookie");
    expect(tierFor(25).name).toBe("Apprentice");
    expect(tierFor(50).name).toBe("Athlete");
    expect(tierFor(75).name).toBe("Expert");
    expect(tierFor(100).name).toBe("Master");
    expect(tierFor(150).name).toBe("Legend");
    expect(tierFor(999).name).toBe("Legend");
  });
});

describe("nivel / xp", () => {
  it("nivelDesdeXp y xpDeNivel son consistentes", () => {
    expect(nivelDesdeXp(0)).toBe(1);
    expect(nivelDesdeXp(50)).toBe(2);
    expect(nivelDesdeXp(200)).toBe(3);
    expect(xpDeNivel(1)).toBe(0);
    expect(xpDeNivel(2)).toBe(50);
    expect(xpDeNivel(3)).toBe(200);
  });
  it("nivel 51 (prestige gate) cae cerca de 125k XP", () => {
    expect(xpDeNivel(51)).toBe(125000);
    expect(nivelDesdeXp(125000)).toBe(51);
  });
  it("cada nivel cuesta más que el anterior", () => {
    const d2 = xpDeNivel(3) - xpDeNivel(2);
    const d3 = xpDeNivel(4) - xpDeNivel(3);
    expect(d3).toBeGreaterThan(d2);
  });
});

describe("className (determinístico)", () => {
  it("sin progreso → Rookie", () => {
    expect(className(zero)).toBe("Rookie");
  });
  it("una stat domina → clase pura de esa stat", () => {
    expect(className(only("fue", 10000))).toBe("The Titan");
    expect(className(only("res", 10000))).toBe("The Marathoner");
    expect(className(only("vel", 10000))).toBe("The Sprinter");
  });
  it("perfil parejo medio → The Athlete; parejo alto → The Pentathlete", () => {
    expect(className(flat(200))).toBe("The Athlete"); // display ~33
    expect(className(flat(10000))).toBe("The Pentathlete"); // display ~78, todas ≥50
  });
  it("todas maxeadas → The Apex", () => {
    expect(className(flat(10_000_000))).toBe("The Apex"); // display ≥150
  });
  it("dúo flex+equ dominante → The Dancer", () => {
    expect(className({ ...zero, flex: 5000, equ: 4000 })).toBe("The Dancer");
  });
  it("prestige añade sufijo Immortal", () => {
    expect(className(only("fue", 10000), 1)).toBe("The Titan · Immortal 1");
  });
});

describe("characterSheet", () => {
  it("integra nivel, clase y tiers; progreso dentro de [0,1]", () => {
    const s = characterSheet(only("fue", 10000));
    expect(s.className).toBe("The Titan");
    expect(s.nivel).toBeGreaterThanOrEqual(1);
    expect(s.tiers.fue.name).toBe("Expert");
    expect(s.tiers.res.name).toBe("Rookie");
    expect(s.progresoNivel).toBeGreaterThanOrEqual(0);
    expect(s.progresoNivel).toBeLessThanOrEqual(1);
    expect(s.xpParaSiguiente).toBeGreaterThanOrEqual(0);
  });
});
