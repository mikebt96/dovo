import { MEALS } from "./data/meals";
import { getServerSupabase } from "./supabase";
import { slugToUuid } from "./profileServer";
import type { DayKey, Meal, MealChange, ProfileId } from "./types";

export interface EffectiveMeal extends Meal {
  /** True si esta meal viene de un re-plan AI (no el seed original). */
  replanned: boolean;
  replanReason?: string;
}

/**
 * Aplica el último `meal_replans` al MEALS hardcoded para devolver lo que el user
 * realmente debe ver hoy. Si no hay replans, devuelve los meals tal cual.
 *
 * La fila más reciente "gana" — para revertir, se inserta una fila vacía con
 * `triggered_by='manual_revert'`.
 */
export async function getEffectiveMealsFor(
  slug: ProfileId,
  day: DayKey
): Promise<EffectiveMeal[]> {
  const seed = MEALS.filter((m) => m.user === slug && m.day === day).sort(
    (a, b) => a.slot - b.slot
  );

  const changes = await loadLatestChanges(slug);
  if (!changes) return seed.map((m) => ({ ...m, replanned: false }));

  const byId = new Map(changes.map((c) => [c.originalId, c]));
  return seed.map((m) => {
    const c = byId.get(m.id);
    if (!c) return { ...m, replanned: false };
    return {
      ...m,
      name: c.newName,
      ingredients: c.newIngredients,
      prepInstructions: c.newPrepInstructions ?? m.prepInstructions,
      replanned: true,
      replanReason: c.reason,
    };
  });
}

export async function getEffectiveDayMacros(slug: ProfileId, day: DayKey) {
  const meals = await getEffectiveMealsFor(slug, day);
  return {
    kcal: meals.reduce((sum, m) => sum + m.kcal, 0),
    proteinG: meals.reduce((sum, m) => sum + m.proteinG, 0),
    mealCount: meals.length,
  };
}

/**
 * Carga el array de cambios de la fila más reciente de `meal_replans`.
 * Devuelve `null` si no hay filas o si la última es un revert (array vacío).
 */
async function loadLatestChanges(slug: ProfileId): Promise<MealChange[] | null> {
  const uuid = await slugToUuid(slug);
  if (!uuid) return null;

  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("meal_replans")
    .select("meals_changed")
    .eq("profile_id", uuid)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const changes = data.meals_changed as MealChange[] | null;
  if (!Array.isArray(changes) || changes.length === 0) return null;
  return changes;
}

export interface ReplanSummary {
  id: number;
  triggeredBy: string;
  generatedAt: string;
  changeCount: number;
  changes: MealChange[];
}

/** Histórico para el panel "Últimos cambios AI" en preferences. */
export async function getReplanHistory(
  slug: ProfileId,
  limit = 5
): Promise<ReplanSummary[]> {
  const uuid = await slugToUuid(slug);
  if (!uuid) return [];

  const sb = getServerSupabase();
  const { data } = await sb
    .from("meal_replans")
    .select("id, triggered_by, generated_at, meals_changed")
    .eq("profile_id", uuid)
    .order("generated_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const changes = (row.meals_changed as MealChange[] | null) ?? [];
    return {
      id: row.id,
      triggeredBy: row.triggered_by,
      generatedAt: row.generated_at,
      changeCount: changes.length,
      changes,
    };
  });
}
