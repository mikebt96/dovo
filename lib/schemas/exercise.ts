import { z } from "zod";

/**
 * Una sola serie de un ejercicio de gym.
 * Mapea 1:1 con `exercises_log.sets[i]` (jsonb).
 */
export const ExerciseSetSchema = z.object({
  reps: z.number().int().min(0).max(100),
  weight_kg: z.number().min(0).max(500).optional(),
  rpe: z.number().int().min(1).max(10).optional(),
});

/**
 * El payload completo de `exercises_log.sets`.
 * Mínimo 1 set, máximo 20 (defensivo contra inputs erróneos).
 */
export const ExerciseSetsSchema = z.array(ExerciseSetSchema).min(1).max(20);

export type ExerciseSet = z.infer<typeof ExerciseSetSchema>;
export type ExerciseSets = z.infer<typeof ExerciseSetsSchema>;
