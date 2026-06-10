// F9 · Sobrecarga progresiva: sugerencia de peso para hoy a partir del último log.
// Regla simple y honesta: si la última vez completaste TODAS las series en el tope del
// rango de reps, sube 2.5 kg; si no, repite el peso y gana reps primero.

import { POR_SLUG } from "./catalog";
import type { SerieLog } from "./types";

/** "8-12" → 12 · "10" → 10 · "6×400m"/"30 min" → null (no aplica progresión por peso). */
export function topeReps(reps: string): number | null {
  const m = /^(\d{1,2})(?:\s*-\s*(\d{1,2}))?$/.exec(reps.trim());
  if (!m) return null;
  return Number(m[2] ?? m[1]);
}

export function sugerirPeso(
  exerciseSlug: string,
  ultimaSeries: SerieLog[],
  repsObjetivo: string,
): number | null {
  const ej = POR_SLUG.get(exerciseSlug);
  if (!ej?.con_peso || ultimaSeries.length === 0) return null;
  const pesos = ultimaSeries
    .map((s) => s.peso_kg)
    .filter((p): p is number => typeof p === "number" && p > 0);
  if (pesos.length === 0) return null;
  const peso = Math.max(...pesos);
  const tope = topeReps(repsObjetivo);
  // reps por tiempo/distancia (6×400m, 30 min) → no aplica sugerencia de peso (null, no el
  // último peso: evita "hoy intenta 50 kg" en un rodaje). Review F9 2026-06-10.
  if (tope === null) return null;
  const completadas = ultimaSeries.every((s) => s.reps >= tope);
  return completadas ? Math.round((peso + 2.5) * 10) / 10 : peso;
}
