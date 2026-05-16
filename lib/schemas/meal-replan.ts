import { z } from "zod";

/**
 * `meal_replans.meals_changed` — qué cambió cuando Claude regeneró el plan.
 */
export const MealReplanChangesSchema = z.array(
  z.object({
    original_id: z.string().max(50),                  // 'lun-mk-1'
    new_name: z.string().max(200),
    new_ingredients: z.string().max(1000),
    new_kcal: z.number().int().min(0).max(3000),
    new_protein_g: z.number().int().min(0).max(200),
    reason: z.string().max(300),
  }),
).max(100);

/**
 * `meal_replans.prefs_snapshot` — copia del estado de prefs del user
 * al momento del replan, para auditoría y diff.
 */
export const DietaryPrefsSnapshotSchema = z.object({
  postal_code: z.string().max(10).nullable(),
  dietary_tags: z.array(z.string().max(50)),
  allergens: z.array(z.string().max(50)),
  disliked_ingredients: z.array(z.string().max(100)),
  liked_ingredients: z.array(z.string().max(100)),
  disliked_textures: z.array(z.string().max(50)),
  max_meal_kcal: z.number().int().min(0).max(3000).nullable(),
  notes_for_ai: z.string().max(1000).nullable(),
  baseline_kcal: z.number().int().min(0).max(5000).nullable(),
  baseline_protein_g: z.number().int().min(0).max(300).nullable(),
});

export type MealReplanChanges = z.infer<typeof MealReplanChangesSchema>;
export type DietaryPrefsSnapshot = z.infer<typeof DietaryPrefsSnapshotSchema>;
