import { describe, it, expect } from "vitest";
import {
  categorizeGoal,
  bucketDuracion,
  bucketTasaCumplimiento,
  dowFromDate,
} from "@/lib/utils/pulse-buckets";

describe("categorizeGoal", () => {
  it("mapea goals físicos a 'fitness' (MVP solo activa scope)", () => {
    expect(categorizeGoal("ir al gym 3 veces por semana")).toBe("fitness");
    expect(categorizeGoal("clases de ballet")).toBe("fitness");
    expect(categorizeGoal("pilates en el mat")).toBe("fitness");
    expect(categorizeGoal("correr 5km al día")).toBe("fitness");
    expect(categorizeGoal("andar en bici al trabajo")).toBe("fitness");
    expect(categorizeGoal("natación en la alberca")).toBe("fitness");
    expect(categorizeGoal("yoga matutino")).toBe("fitness");
    expect(categorizeGoal("ejercicio diario")).toBe("fitness");
  });

  it("fallback a 'otro' cuando ningún keyword físico matchea", () => {
    expect(categorizeGoal("leer 30 min al día")).toBe("otro");
    expect(categorizeGoal("no fumar")).toBe("otro");
    expect(categorizeGoal("ahorrar mxn500 semanales")).toBe("otro");
  });

  it("case insensitive", () => {
    expect(categorizeGoal("IR AL GYM")).toBe("fitness");
    expect(categorizeGoal("Ballet Clase")).toBe("fitness");
  });
});

describe("bucketDuracion", () => {
  it("buckets correctos según schema constraint", () => {
    expect(bucketDuracion(1)).toBe("<7d");
    expect(bucketDuracion(6)).toBe("<7d");
    expect(bucketDuracion(7)).toBe("7-14d");
    expect(bucketDuracion(14)).toBe("7-14d");
    expect(bucketDuracion(15)).toBe("14-30d");
    expect(bucketDuracion(30)).toBe("14-30d");
    expect(bucketDuracion(31)).toBe("30-60d");
    expect(bucketDuracion(60)).toBe("30-60d");
    expect(bucketDuracion(61)).toBe("60-90d");
    expect(bucketDuracion(90)).toBe("60-90d");
    expect(bucketDuracion(91)).toBe(">90d");
    expect(bucketDuracion(365)).toBe(">90d");
  });
});

describe("bucketTasaCumplimiento", () => {
  it("buckets correctos por proporción", () => {
    expect(bucketTasaCumplimiento(0, 10)).toBe("0-0.2");
    expect(bucketTasaCumplimiento(2, 10)).toBe("0-0.2");
    expect(bucketTasaCumplimiento(3, 10)).toBe("0.2-0.5");
    expect(bucketTasaCumplimiento(5, 10)).toBe("0.2-0.5");
    expect(bucketTasaCumplimiento(6, 10)).toBe("0.5-0.8");
    expect(bucketTasaCumplimiento(8, 10)).toBe("0.5-0.8");
    expect(bucketTasaCumplimiento(9, 10)).toBe("0.8-1.0");
    expect(bucketTasaCumplimiento(10, 10)).toBe("0.8-1.0");
  });

  it("requeridos<=0 cae en 0-0.2 (default defensive)", () => {
    expect(bucketTasaCumplimiento(0, 0)).toBe("0-0.2");
    expect(bucketTasaCumplimiento(5, -1)).toBe("0-0.2");
  });
});

describe("dowFromDate", () => {
  it("retorna entero entre 0 y 6", () => {
    const dow = dowFromDate(new Date().toISOString());
    expect(dow).toBeGreaterThanOrEqual(0);
    expect(dow).toBeLessThanOrEqual(6);
  });

  it("domingo es 0", () => {
    expect(dowFromDate("2026-05-17T12:00:00-06:00")).toBe(0);
  });

  it("miércoles es 3", () => {
    expect(dowFromDate("2026-05-20T12:00:00-06:00")).toBe(3);
  });
});
