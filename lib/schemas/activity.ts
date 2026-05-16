import { z } from "zod";

/**
 * Detalles sport-specific de una actividad no-gym.
 * Discriminated union por `activity_type` (que en DB vive como columna separada,
 * aquí lo replicamos como `kind` para la discriminada).
 *
 * El campo `details` en `activity_log` guarda el resto: distance_km, pace,
 * choreography, laps, etc. Cada deporte tiene su shape.
 */

const RunningDetails = z.object({
  kind: z.literal("running"),
  distance_km: z.number().min(0).max(100),
  pace_min_per_km: z.number().min(2).max(15).optional(),
  elevation_m: z.number().min(0).max(5000).optional(),
});

const SwimmingDetails = z.object({
  kind: z.literal("swimming"),
  laps: z.number().int().min(0).max(500),
  pool_length_m: z.number().int().min(10).max(100).optional(),
  stroke: z.enum(["freestyle", "back", "breast", "fly", "mixed"]).optional(),
});

const CyclingDetails = z.object({
  kind: z.literal("cycling"),
  distance_km: z.number().min(0).max(300),
  avg_speed_kmh: z.number().min(0).max(80).optional(),
  indoor: z.boolean().optional(),
});

const BalletDetails = z.object({
  kind: z.literal("ballet"),
  level: z.enum(["beginner", "intermediate", "advanced", "professional"]).optional(),
  focus: z.string().max(200).optional(),       // 'barre', 'centro', 'variaciones'
  performance: z.boolean().optional(),
});

const PilatesDetails = z.object({
  kind: z.literal("pilates"),
  style: z.enum(["mat", "reformer", "tower", "chair"]).optional(),
  focus: z.string().max(200).optional(),
});

const YogaDetails = z.object({
  kind: z.literal("yoga"),
  style: z.enum(["vinyasa", "hatha", "yin", "ashtanga", "restorative"]).optional(),
});

const WalkDetails = z.object({
  kind: z.literal("walk"),
  distance_km: z.number().min(0).max(50).optional(),
  steps: z.number().int().min(0).max(100000).optional(),
});

const OtherDetails = z.object({
  kind: z.literal("other"),
  description: z.string().max(500),
});

export const ActivityDetailsSchema = z.discriminatedUnion("kind", [
  RunningDetails,
  SwimmingDetails,
  CyclingDetails,
  BalletDetails,
  PilatesDetails,
  YogaDetails,
  WalkDetails,
  OtherDetails,
]);

export type ActivityDetails = z.infer<typeof ActivityDetailsSchema>;
export type ActivityKind = ActivityDetails["kind"];
