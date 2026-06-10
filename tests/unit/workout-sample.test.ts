import { describe, expect, it } from "vitest";
import { CATALOGO, POR_SLUG } from "@/lib/workout/catalog";
import { buildSampleWorkout } from "@/lib/workout/sample-plans";
import { sugerirPeso, topeReps } from "@/lib/workout/progresion";
import type { PerfilFisico } from "@/lib/workout/types";

const fisico = (objetivo: PerfilFisico["objetivo"]): PerfilFisico => ({
  peso_kg: 80,
  altura_cm: 176,
  edad: 30,
  genero: "masculino",
  nivel_actividad: "moderado",
  objetivo,
  bmr_calculado: 1800,
});

// La rutina del demo Iván: gym 2× + running 2× + pilates 2×.
const RUTINA_IVAN = [
  { slug: "gym", frecuencia_semanal: 2, duracion_min: 60 },
  { slug: "running", frecuencia_semanal: 2, duracion_min: 40 },
  { slug: "pilates", frecuencia_semanal: 2, duracion_min: 45 },
];

describe("catálogo", () => {
  it("slugs únicos", () => {
    expect(new Set(CATALOGO.map((e) => e.slug)).size).toBe(CATALOGO.length);
  });
});

describe("buildSampleWorkout", () => {
  it("es determinista: misma entrada ⇒ mismo plan", () => {
    const a = buildSampleWorkout(fisico("ganar_musculo"), RUTINA_IVAN);
    const b = buildSampleWorkout(fisico("ganar_musculo"), RUTINA_IVAN);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("respeta las frecuencias de la rutina", () => {
    const plan = buildSampleWorkout(fisico("ganar_musculo"), RUTINA_IVAN);
    expect(plan.dias).toHaveLength(6);
    const porActividad = plan.dias.reduce<Record<string, number>>((acc, d) => {
      acc[d.actividad_slug] = (acc[d.actividad_slug] ?? 0) + 1;
      return acc;
    }, {});
    expect(porActividad).toEqual({ gym: 2, running: 2, pilates: 2 });
  });

  it("días únicos y todos los slugs existen en el catálogo", () => {
    for (const objetivo of ["ganar_musculo", "perder_grasa", "mantener"] as const) {
      const plan = buildSampleWorkout(fisico(objetivo), RUTINA_IVAN);
      const dias = plan.dias.map((d) => d.dia);
      expect(new Set(dias).size).toBe(dias.length);
      for (const d of plan.dias) {
        expect(d.bloques.length).toBeGreaterThan(0);
        for (const b of d.bloques) {
          expect(POR_SLUG.has(b.exercise_slug), b.exercise_slug).toBe(true);
          expect(b.series).toBeGreaterThanOrEqual(1);
          expect(b.series).toBeLessThanOrEqual(6);
        }
      }
    }
  });

  it("gym 2× usa full body a/b con los básicos del demo (hip thrust, curl)", () => {
    const plan = buildSampleWorkout(fisico("ganar_musculo"), RUTINA_IVAN);
    const slugs = plan.dias
      .filter((d) => d.actividad_slug === "gym")
      .flatMap((d) => d.bloques.map((b) => b.exercise_slug));
    for (const esperado of ["sentadilla", "press-banca", "remo-barra", "hip-thrust", "curl-biceps"]) {
      expect(slugs, esperado).toContain(esperado);
    }
  });

  it("ganar_musculo da descansos largos a compuestos; perder_grasa, cortos", () => {
    const musculo = buildSampleWorkout(fisico("ganar_musculo"), RUTINA_IVAN);
    const grasa = buildSampleWorkout(fisico("perder_grasa"), RUTINA_IVAN);
    const compDesc = (p: typeof musculo) =>
      p.dias
        .filter((d) => d.actividad_slug === "gym")
        .flatMap((d) => d.bloques)
        .filter((b) => POR_SLUG.get(b.exercise_slug)?.compuesto)
        .map((b) => b.descanso_seg);
    expect(Math.min(...compDesc(musculo))).toBeGreaterThanOrEqual(120);
    expect(Math.max(...compDesc(grasa))).toBeLessThanOrEqual(60);
  });

  it("recorta a 7 sesiones cuando la rutina pide más", () => {
    const plan = buildSampleWorkout(fisico("mantener"), [
      { slug: "gym", frecuencia_semanal: 5, duracion_min: 60 },
      { slug: "running", frecuencia_semanal: 4, duracion_min: 40 },
      { slug: "pilates", frecuencia_semanal: 3, duracion_min: 45 },
    ]);
    expect(plan.dias.length).toBeLessThanOrEqual(7);
  });

  it("filtra por equipo disponible (prefs Pro) sin salirse del grupo muscular", () => {
    const plan = buildSampleWorkout(fisico("ganar_musculo"), RUTINA_IVAN, {
      equipo: ["mancuernas", "peso_corporal"],
    });
    const gymBloques = plan.dias
      .filter((d) => d.actividad_slug === "gym")
      .flatMap((d) => d.bloques);
    for (const b of gymBloques) {
      const ej = POR_SLUG.get(b.exercise_slug)!;
      expect(
        ej.equipo.some((e) => e === "mancuernas" || e === "peso_corporal"),
        `${b.exercise_slug} requiere ${ej.equipo.join(",")}`,
      ).toBe(true);
    }
  });

  it("equipo restrictivo NUNCA duplica ejercicios en una sesión (review F9)", () => {
    for (const equipo of [["mancuernas"], ["peso_corporal"], ["polea"], ["banda"]] as const) {
      const plan = buildSampleWorkout(
        fisico("ganar_musculo"),
        [{ slug: "gym", frecuencia_semanal: 4, duracion_min: 60 }],
        { equipo: [...equipo] },
      );
      for (const d of plan.dias) {
        const slugs = d.bloques.map((b) => b.exercise_slug);
        expect(new Set(slugs).size, `${equipo.join(",")} → ${d.titulo}: ${slugs.join(",")}`).toBe(
          slugs.length,
        );
      }
    }
  });
});

describe("fecha CDMX", () => {
  it("hoyCDMX es ISO y diaSemanaCDMX coincide con DIAS_SEMANA del plan", async () => {
    const { hoyCDMX, diaSemanaCDMX } = await import("@/lib/workout/fecha");
    const { DIAS_SEMANA } = await import("@/lib/workout/types");
    expect(hoyCDMX()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(DIAS_SEMANA).toContain(diaSemanaCDMX());
  });
});

describe("progresión", () => {
  it("topeReps parsea rangos y rechaza cardio", () => {
    expect(topeReps("8-12")).toBe(12);
    expect(topeReps("10")).toBe(10);
    expect(topeReps("6×400m")).toBeNull();
    expect(topeReps("30 min")).toBeNull();
  });

  it("sube 2.5 kg solo si TODAS las series llegaron al tope", () => {
    const completas = [
      { reps: 12, peso_kg: 40 },
      { reps: 12, peso_kg: 40 },
      { reps: 12, peso_kg: 40 },
    ];
    const incompletas = [
      { reps: 12, peso_kg: 40 },
      { reps: 10, peso_kg: 40 },
      { reps: 8, peso_kg: 40 },
    ];
    expect(sugerirPeso("hip-thrust", completas, "8-12")).toBe(42.5);
    expect(sugerirPeso("hip-thrust", incompletas, "8-12")).toBe(40);
  });

  it("sin peso registrado o ejercicio sin peso ⇒ null", () => {
    expect(sugerirPeso("plancha", [{ reps: 1, peso_kg: null }], "30 seg")).toBeNull();
    expect(sugerirPeso("hip-thrust", [{ reps: 10, peso_kg: null }], "8-12")).toBeNull();
  });
});
