// Helpers de presentación de stats, compartidos por home / perfil / leaderboard.
// La lógica de tiers/clases/nivel vive en index.ts; esto es solo visual.
import { STAT_KEYS, type StatKey } from "@/lib/scoring/types";

// Orden canónico de los 6 stats (FUE, RES, FLEX, VEL, EQU, VIT).
export { STAT_KEYS };

// Etiqueta corta (3 letras, vocabulario de marca — no se traduce, ver DESIGN.md §3).
export const STAT_SHORT: Record<StatKey, string> = {
  fue: "FUE",
  res: "RES",
  flex: "FLE",
  vel: "VEL",
  equ: "EQU",
  vit: "VIT",
};

// Relleno de barra 0-100% desde un acumulador crudo (escala log, sin cap).
// Misma escala que usaba home-authed para mantener consistencia visual app-wide.
export function barHeight(v: number): number {
  if (!(v > 0)) return 4;
  return Math.min(100, Math.round((Math.log10(v + 1) / 2.2) * 100));
}

// Stat dominante (para "top stat" del leaderboard / share card).
export function topStat(stats: Record<StatKey, number>): StatKey {
  return STAT_KEYS.reduce((best, k) => (stats[k] > stats[best] ? k : best), "fue");
}
