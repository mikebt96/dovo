import { z } from "zod";

/**
 * Recomendaciones estructuradas que Claude genera al revisar la semana.
 * Guardado en `weekly_reviews.recommendations`.
 */

const WeeklyRecommendationsV1 = z.object({
  version: z.literal("v1"),
  kcal_next_week: z
    .object({
      delta: z.number().int().min(-500).max(500),    // +200 / -150 sobre baseline
      reason: z.string().max(300),
    })
    .optional(),
  protein_g_next_week: z
    .object({
      target: z.number().int().min(50).max(300),
      reason: z.string().max(300),
    })
    .optional(),
  training_changes: z
    .array(
      z.object({
        change_type: z.enum(["volume_up", "volume_down", "deload", "swap", "add", "remove"]),
        target: z.string().max(150),                  // 'glúteo', 'pecho', etc.
        reason: z.string().max(300),
      }),
    )
    .max(5)
    .optional(),
  alerts: z
    .array(
      z.object({
        severity: z.enum(["info", "warning", "critical"]),
        message: z.string().max(400),
      }),
    )
    .max(5)
    .optional(),
  encouragement: z.string().max(500).optional(),
});

export const WeeklyRecommendationsSchema = z.discriminatedUnion("version", [
  WeeklyRecommendationsV1,
]);

export type WeeklyRecommendations = z.infer<typeof WeeklyRecommendationsSchema>;
