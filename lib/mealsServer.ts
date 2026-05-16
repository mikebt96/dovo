import { MEALS } from "./data/meals";
import { getServerSupabase } from "./supabase";
import { slugToUuid } from "./profileServer";
import type {
  DayKey,
  Meal,
  MealChange,
  MealChangeWithDelta,
  ProfileId,
} from "./types";

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
      // Si AI devolvió macros nuevos (contrato post-v5), úsalos. Si no,
      // fallback al seed — preserva retrocompat con replans antiguos.
      kcal: c.newKcal ?? m.kcal,
      proteinG: c.newProteinG ?? m.proteinG,
      replanned: true,
      replanReason: c.reason,
    };
  });
}

/**
 * Devuelve un meal específico por id con overrides AI aplicados, junto al
 * id del replan que lo generó (o null si vino del seed).
 *
 * Lo usa `toggleCheck` al marcar una meal como completada para capturar
 * el snapshot inmutable del contenido al momento del click.
 */
export async function getEffectiveMealById(
  slug: ProfileId,
  mealId: string
): Promise<{ meal: EffectiveMeal | null; replanId: number | null }> {
  const original = MEALS.find((m) => m.id === mealId);
  if (!original) return { meal: null, replanId: null };

  const fallback = { meal: { ...original, replanned: false }, replanId: null };

  const uuid = await slugToUuid(slug);
  if (!uuid) return fallback;

  const sb = getServerSupabase();
  const { data } = await sb
    .from("meal_replans")
    .select("id, meals_changed")
    .eq("profile_id", uuid)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return fallback;
  const changes = (data.meals_changed as MealChange[] | null) ?? [];
  const c = changes.find((x) => x.originalId === mealId);
  if (!c) return fallback;

  return {
    meal: {
      ...original,
      name: c.newName,
      ingredients: c.newIngredients,
      prepInstructions: c.newPrepInstructions ?? original.prepInstructions,
      kcal: c.newKcal ?? original.kcal,
      proteinG: c.newProteinG ?? original.proteinG,
      replanned: true,
      replanReason: c.reason,
    },
    replanId: data.id as number,
  };
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
  changes: MealChangeWithDelta[];
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

  // Index `MEALS` por id para join in-memory eficiente.
  const mealsById = new Map(MEALS.map((m) => [m.id, m]));

  return (data ?? []).map((row) => {
    const rawChanges = (row.meals_changed as MealChange[] | null) ?? [];
    const changes: MealChangeWithDelta[] = rawChanges.map((c) => {
      const original = mealsById.get(c.originalId);
      return {
        ...c,
        originalKcal: original?.kcal,
        originalProteinG: original?.proteinG,
        originalName: original?.name,
      };
    });
    return {
      id: row.id,
      triggeredBy: row.triggered_by,
      generatedAt: row.generated_at,
      changeCount: changes.length,
      changes,
    };
  });
}
