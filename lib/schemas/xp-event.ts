import { z } from "zod";

/**
 * Payload opcional de un evento de XP.
 * Guardado en `xp_events.payload` (jsonb).
 *
 * Discriminado por la columna `source` de la fila padre.
 * Sirve para reconstruir el evento sin joins (¿qué comida marcó? ¿qué ejercicio?).
 */

const MealPayload = z.object({
  kind: z.literal("meal"),
  meal_id: z.string().max(50),
  hunger_after: z.number().int().min(1).max(5).optional(),
});

const ExercisePayload = z.object({
  kind: z.literal("exercise"),
  exercise_id: z.string().max(50),
  total_volume_kg: z.number().min(0).optional(),     // sum(reps × weight)
});

const DayCompletePayload = z.object({
  kind: z.literal("day_complete"),
  date: z.string().date(),
  components_completed: z.array(z.string().max(50)), // ['meals','training','prep']
});

const PairBonusPayload = z.object({
  kind: z.literal("pair_bonus"),
  partner_slug: z.enum(["mike", "andy"]),
  streak_day: z.number().int().min(1),
});

const SurprisePayload = z.object({
  kind: z.literal("surprise"),
  surprise_id: z.number().int(),
  type: z.string().max(50),
});

const PenaltyPayload = z.object({
  kind: z.literal("penalty"),
  penalty_id: z.number().int(),
  reason: z.string().max(300).optional(),
});

export const XpEventPayloadSchema = z.discriminatedUnion("kind", [
  MealPayload,
  ExercisePayload,
  DayCompletePayload,
  PairBonusPayload,
  SurprisePayload,
  PenaltyPayload,
]);

export type XpEventPayload = z.infer<typeof XpEventPayloadSchema>;
