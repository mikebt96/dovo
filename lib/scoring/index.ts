import { calcularKcal } from "./kcal";
import { calcularPuntos } from "./puntos";
import { distribuirStats } from "./stats";
import type { ActividadScoring, Metricas, PerfilScoring, StatDeltas } from "./types";

export * from "./types";
export { calcularKcal, factorIntensidad } from "./kcal";
export { calcularPuntos } from "./puntos";
export { distribuirStats } from "./stats";

export type CheckinScore = { kcal: number; puntos: number; deltas: StatDeltas };

export function calcularCheckin(
  actividad: ActividadScoring,
  metricas: Metricas,
  perfil: PerfilScoring,
  duracionMin: number,
): CheckinScore {
  const kcal = calcularKcal(actividad, metricas, perfil, duracionMin);
  const puntos = calcularPuntos(kcal, perfil.bmr);
  const deltas = distribuirStats(puntos, actividad);
  return { kcal, puntos, deltas };
}
