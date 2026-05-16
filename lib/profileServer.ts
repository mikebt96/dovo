import { getServerSupabase } from "./supabase";
import type { DietaryProfile, ProfileId } from "./types";

/**
 * Server-side: traduce slug ('mike'|'andy') → uuid interno.
 * Usar SIEMPRE antes de cualquier query que toque profiles.id.
 */
export async function slugToUuid(slug: ProfileId): Promise<string | null> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select("id")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return data.id;
}

export async function getDietaryProfile(
  slug: ProfileId
): Promise<DietaryProfile | null> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from("profiles")
    .select(
      "postal_code, dietary_tags, allergens, disliked_ingredients, liked_ingredients, disliked_textures, max_meal_kcal, notes_for_ai"
    )
    .eq("slug", slug)
    .single();
  if (!data) return null;
  return {
    postalCode: data.postal_code ?? undefined,
    dietaryTags: data.dietary_tags ?? [],
    allergens: data.allergens ?? [],
    dislikedIngredients: data.disliked_ingredients ?? [],
    likedIngredients: data.liked_ingredients ?? [],
    dislikedTextures: data.disliked_textures ?? [],
    maxMealKcal: data.max_meal_kcal ?? undefined,
    notesForAi: data.notes_for_ai ?? undefined,
  };
}

export async function updateDietaryProfile(
  slug: ProfileId,
  patch: Partial<DietaryProfile>
): Promise<void> {
  const sb = getServerSupabase();
  const row: Record<string, unknown> = {};
  if (patch.postalCode !== undefined) row.postal_code = patch.postalCode || null;
  if (patch.dietaryTags) row.dietary_tags = patch.dietaryTags;
  if (patch.allergens) row.allergens = patch.allergens;
  if (patch.dislikedIngredients) row.disliked_ingredients = patch.dislikedIngredients;
  if (patch.likedIngredients) row.liked_ingredients = patch.likedIngredients;
  if (patch.dislikedTextures) row.disliked_textures = patch.dislikedTextures;
  if (patch.maxMealKcal !== undefined) row.max_meal_kcal = patch.maxMealKcal ?? null;
  if (patch.notesForAi !== undefined) row.notes_for_ai = patch.notesForAi || null;

  if (Object.keys(row).length === 0) return;
  await sb.from("profiles").update(row).eq("slug", slug);
}
