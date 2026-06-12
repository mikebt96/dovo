import type { ActividadScoring, StatDeltas, StatKey } from "./types";
import { STAT_KEYS, STAT_FROM_LABEL } from "./types";
import { STAT_PRIMARY_FACTOR, STAT_SECONDARY_FACTOR } from "./constants";

export function distribuirStats(puntos: number, actividad: ActividadScoring): StatDeltas {
  const d: StatDeltas = { fue: 0, res: 0, flex: 0, vel: 0, equ: 0, vit: 0 };
  for (const label of actividad.stats_primary) {
    const k = STAT_FROM_LABEL[label];
    if (k) d[k] += puntos * STAT_PRIMARY_FACTOR;
  }
  for (const label of actividad.stats_secondary) {
    const k = STAT_FROM_LABEL[label];
    if (k) d[k] += puntos * STAT_SECONDARY_FACTOR;
  }
  for (const k of STAT_KEYS) d[k] = Math.round(d[k] * 100) / 100;
  return d;
}
