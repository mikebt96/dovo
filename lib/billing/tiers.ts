// Tiers de dovo + el MAPA DE GATES configurable (F7). Módulo PURO (sin server-only):
// importable desde server y client. Registrar una feature Pro = 1 línea en FEATURE_TIERS
// → F5/F6 se cuelgan del paywall sin retrabajo (rompe la falsa dependencia "F7 necesita F5").

export type Tier = "free" | "pro" | "premium";

export const TIER_RANK: Record<Tier, number> = { free: 0, pro: 1, premium: 2 };

/** ¿`have` cubre el mínimo `need`? (premium cubre pro, pro cubre free) */
export function meetsTier(have: Tier, need: Tier): boolean {
  return TIER_RANK[have] >= TIER_RANK[need];
}

// Features gateables. El gate es CONFIG, no hardcode: F5/F6 sólo agregan su llave aquí.
export type Feature = "nutrition" | "body_scan" | "partner_premium";

export const FEATURE_TIERS: Record<Feature, Tier> = {
  nutrition: "pro", // F5 · planes de comida con IA
  body_scan: "pro", // F6 · análisis de composición corporal
  partner_premium: "pro", // F4 · descuentos premium de partners
};

// Todo lo que NO está en el mapa = free (motor completo: check-ins, stats, niveles,
// leaderboard, retos, wishlist, recompensas por racha, share cards).
