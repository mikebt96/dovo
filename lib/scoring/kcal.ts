import type { ActividadScoring, Metricas, PerfilScoring } from "./types";
import {
  PESO_REFERENCIA_KG,
  INTENSIDAD_BASE,
  INTENSIDAD_STEP,
  FACTOR_DEFAULT,
} from "./constants";

// Solo actividades con métrica `intensidad` (ballet/pilates) escalan; el resto = 1.0.
// Refinar pace (running) / volumen (gym) es tuning futuro, no F2.
export function factorIntensidad(_actividad: ActividadScoring, metricas: Metricas): number {
  const i = metricas.intensidad;
  if (typeof i === "number" && i >= 1 && i <= 5) {
    return INTENSIDAD_BASE + (i - 1) * INTENSIDAD_STEP;
  }
  return FACTOR_DEFAULT;
}

export function calcularKcal(
  actividad: ActividadScoring,
  metricas: Metricas,
  perfil: PerfilScoring,
  duracionMin: number,
): number {
  const durRaw = metricas.tiempo_min ?? duracionMin;
  const minutos = Number.isFinite(durRaw) && durRaw > 0 ? durRaw : 0;
  const peso = perfil.peso_kg > 0 ? perfil.peso_kg : PESO_REFERENCIA_KG;
  const pesoFactor = peso / PESO_REFERENCIA_KG;
  const kcal = actividad.kcal_por_min * minutos * pesoFactor * factorIntensidad(actividad, metricas);
  return Math.round(kcal * 100) / 100;
}
