"use server";

import "server-only";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import { requireSlug } from "@/lib/auth/session";
import { rewardExerciseLog } from "@/lib/gamification/awards";

/**
 * Persiste 1 ejercicio de gym a `exercises_log`.
 *
 * v1 guarda solo el "top set" (peso/reps/RPE máximo del día) como un array
 * de 1 elemento — compatible con el ExerciseSetsSchema (jsonb 1..20 sets).
 * Cuando F11 expanda el logger a multi-set, el shape ya soporta más rows.
 *
 * Idempotente: UNIQUE (profile_id, date, exercise_id) en schema. Re-log
 * sobrescribe el set (último gana). XP award es idempotente por
 * source_ref='exercise:{id}:{date}'.
 */

const TopSet = z.object({
  weight: z.string().optional(),   // input del form (string)
  reps: z.string().optional(),
  rpe: z.string().optional(),
});

const Input = z.object({
  profile: z.enum(["mike", "andy"]),
  date: z.string().date(),
  exercise_id: z.string().min(1).max(50),
  done: z.boolean(),
  top_set: TopSet.optional(),
  notes: z.string().max(500).optional(),
});

type LogResult = { ok: true } | { ok: false; error: string };

/** Parse string→number con sanity check. Devuelve undefined si vacío o inválido. */
function num(s: string | undefined, min: number, max: number): number | undefined {
  if (!s || s.trim() === "") return undefined;
  const n = Number(s);
  if (!Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
}

export async function logExercise(input: z.infer<typeof Input>): Promise<LogResult> {
  await requireSlug();

  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Input inválido" };
  const data = parsed.data;

  const profile_id = await slugToUuid(data.profile);
  if (!profile_id) return { ok: false, error: "Perfil no encontrado" };

  const sb = getServerSupabase();

  // Construir set normalizado del top set
  const set = {
    reps: num(data.top_set?.reps, 0, 100) ?? 0,
    weight_kg: num(data.top_set?.weight, 0, 500),
    rpe: num(data.top_set?.rpe, 1, 10),
  };
  const sets = [set]; // v1: 1 top set; futuro: array completo

  if (!data.done) {
    // Quitar el log (undo del checkbox done)
    const { error } = await sb
      .from("exercises_log")
      .delete()
      .eq("profile_id", profile_id)
      .eq("date", data.date)
      .eq("exercise_id", data.exercise_id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  // Upsert exercises_log (idempotente por unique constraint)
  const { error } = await sb
    .from("exercises_log")
    .upsert(
      {
        profile_id,
        date: data.date,
        exercise_id: data.exercise_id,
        sets,
        notes: data.notes ?? null,
      },
      { onConflict: "profile_id,date,exercise_id" },
    );
  if (error) return { ok: false, error: error.message };

  // Award XP (idempotente por source_ref). Volumen es reps*peso si ambos existen.
  const total_volume_kg =
    set.weight_kg !== undefined ? set.reps * set.weight_kg : undefined;
  await rewardExerciseLog({
    profile_id,
    exercise_id: data.exercise_id,
    date: data.date,
    total_volume_kg,
  });

  return { ok: true };
}
