/**
 * Reglas de gamificación — constantes ajustables.
 *
 * Filosofía: empieza generoso para enganche, después afina con datos.
 * Cada coin ≈ 5 XP (equivalencia para casar con rewards_catalog donde
 * los premios fáciles cuestan 50 coins ≈ ~1 semana de día_completo).
 *
 * Cuando ajustes estos valores, **NO se recalculan eventos pasados** —
 * el ledger xp_events guarda el `amount` y el `multiplier` que aplicaba
 * en ese momento. Solo afecta a awards futuros.
 */

// XP por evento
export const XP_PER_MEAL = 10;
export const XP_PER_EXERCISE = 25;              // 1 top set logueado en gym
export const XP_PER_ACTIVITY = 25;              // 1 sesión ballet/pilates/etc
export const XP_DAY_COMPLETE_BONUS = 50;
export const XP_PAIR_BONUS = 25;
export const XP_PENALTY_DEFAULT = -50;          // configurable por penalty.severity

// Coins (~5 XP cada uno; mantén la equivalencia)
export const COINS_DAY_COMPLETE = 10;
export const COINS_PAIR_BONUS = 5;

// Leveling
export const XP_PER_LEVEL = 500;

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

export function nextLevelXp(level: number): number {
  return level * XP_PER_LEVEL;
}
