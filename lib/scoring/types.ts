export type StatKey = "fue" | "res" | "flex" | "vel" | "equ" | "vit";
export type StatDeltas = Record<StatKey, number>;
export type Metricas = Record<string, number>;

// Subset del catálogo core.actividades que el scoring necesita.
export type ActividadScoring = {
  slug: string;
  kcal_por_min: number;
  stats_primary: string[]; // ej. ['FUE'], ['FLEX','EQU']
  stats_secondary: string[];
};

export type PerfilScoring = { peso_kg: number; bmr: number };

export const STAT_KEYS: StatKey[] = ["fue", "res", "flex", "vel", "equ", "vit"];

/** Label de dominio (FUE/RES/FLEX/VEL/EQU/VIT — como llega de DB/RPC) → StatKey.
 *  Único origen (F23·G5): antes vivía copiado en 4+ archivos. */
export const STAT_FROM_LABEL: Record<string, StatKey> = {
  FUE: "fue",
  RES: "res",
  FLEX: "flex",
  VEL: "vel",
  EQU: "equ",
  VIT: "vit",
};
