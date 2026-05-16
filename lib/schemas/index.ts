/**
 * Source of truth para los `jsonb` columns del schema.
 *
 * Patrón:
 *   1. Antes de INSERT/UPDATE en un jsonb column, validar con `.parse()`.
 *   2. Después de SELECT, validar con `.safeParse()` (datos viejos pueden estar mal).
 *   3. Versionar AI outputs con `version: 'vN'` y discriminated union.
 */

export * from "./exercise";
export * from "./activity";
export * from "./body-analysis";
export * from "./weekly-review";
export * from "./xp-event";
export * from "./meal-replan";
