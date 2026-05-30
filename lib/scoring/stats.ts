import type { ActividadScoring, StatDeltas, StatKey } from "./types";
import { STAT_KEYS } from "./types";
import { STAT_PRIMARY_FACTOR, STAT_SECONDARY_FACTOR } from "./constants";

const LABEL_TO_KEY: Record<string, StatKey> = {
  FUE: "fue", RES: "res", FLEX: "flex", VEL: "vel", EQU: "equ", VIT: "vit",
};

export function distribuirStats(puntos: number, actividad: ActividadScoring): StatDeltas {
  const d: StatDeltas = { fue: 0, res: 0, flex: 0, vel: 0, equ: 0, vit: 0 };
  for (const label of actividad.stats_primary) {
    const k = LABEL_TO_KEY[label];
    if (k) d[k] += puntos * STAT_PRIMARY_FACTOR;
  }
  for (const label of actividad.stats_secondary) {
    const k = LABEL_TO_KEY[label];
    if (k) d[k] += puntos * STAT_SECONDARY_FACTOR;
  }
  for (const k of STAT_KEYS) d[k] = Math.round(d[k] * 100) / 100;
  return d;
}
