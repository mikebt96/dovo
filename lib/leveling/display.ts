// Helpers de presentación de stats, compartidos por home / perfil / leaderboard.
// La lógica de tiers/clases/nivel vive en index.ts; esto es solo visual.
import { STAT_KEYS, STAT_FROM_LABEL, type StatKey } from "@/lib/scoring/types";
import { statDisplay } from "./index";

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

// Relleno de barra 0-100% anclado a la escala de tiers (display 0..150,
// Legend = barra llena). La escala log anterior saturaba al 100% con stats
// medios — la barra MENTÍA sobre el sistema (un Athlete con barra llena no
// tiene a dónde crecer). Ahora es consistente con el número display y el tier
// que se muestran junto a cada barra (directiva del consejo, legibilidad).
export function barHeight(v: number): number {
  const d = statDisplay(v);
  return Math.max(4, Math.min(100, Math.round((d / 150) * 100)));
}

// Stat dominante (para "top stat" del leaderboard / share card).
export function topStat(stats: Record<StatKey, number>): StatKey {
  return STAT_KEYS.reduce((best, k) => (stats[k] > stats[best] ? k : best), "fue");
}

// Re-export para componentes (el dominio vive en scoring/types).
export { STAT_FROM_LABEL };

// ── Mapas de presentación canónicos (F23·G5 — antes copiados en 6 componentes).
// Las clases bg-stat-*/text-stat-* se referencian de forma ESTÁTICA para que
// Tailwind no las purgue; los var(--stat-*) son theme-reactivos. ──
export const STAT_VAR: Record<StatKey, string> = {
  fue: "var(--stat-fue)",
  res: "var(--stat-res)",
  flex: "var(--stat-flex)",
  vel: "var(--stat-vel)",
  equ: "var(--stat-equ)",
  vit: "var(--stat-vit)",
};
export const STAT_BG_CLASS: Record<StatKey, string> = {
  fue: "bg-stat-fue",
  res: "bg-stat-res",
  flex: "bg-stat-flex",
  vel: "bg-stat-vel",
  equ: "bg-stat-equ",
  vit: "bg-stat-vit",
};
export const STAT_TEXT_CLASS: Record<StatKey, string> = {
  fue: "text-stat-fue",
  res: "text-stat-res",
  flex: "text-stat-flex",
  vel: "text-stat-vel",
  equ: "text-stat-equ",
  vit: "text-stat-vit",
};
