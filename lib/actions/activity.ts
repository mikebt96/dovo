"use server";

import "server-only";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import { requireSlug } from "@/lib/auth/session";
import { rewardActivityLog } from "@/lib/gamification/awards";

/**
 * CRUD para `activity_log` (ballet, pilates, running, swimming, etc).
 *
 * Cada sesión es una fila nueva (no unique constraint en activity_log).
 * El `id` (bigserial) lo devuelve el INSERT y se usa para borrar.
 *
 * Award XP por sesión, idempotente por source_ref='activity:{id}' — como
 * el id es único por fila, ningún reintento puede otorgar 2 veces.
 */

const ACTIVITY_TYPES = [
  "ballet", "pilates", "running", "swimming",
  "cycling", "yoga", "walk", "other",
] as const;

const LogInput = z.object({
  profile: z.enum(["mike", "andy"]),
  date: z.string().date(),
  activity_type: z.enum(ACTIVITY_TYPES),
  duration_min: z.number().int().min(1).max(720),
  intensity: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
});

const RemoveInput = z.object({
  profile: z.enum(["mike", "andy"]),
  id: z.number().int().positive(),
});

type LogResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

type RemoveResult = { ok: true } | { ok: false; error: string };

export async function logActivity(
  input: z.infer<typeof LogInput>,
): Promise<LogResult> {
  await requireSlug();

  const parsed = LogInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Input inválido" };
  const data = parsed.data;

  const profile_id = await slugToUuid(data.profile);
  if (!profile_id) return { ok: false, error: "Perfil no encontrado" };

  const sb = getServerSupabase();
  const { data: inserted, error } = await sb
    .from("activity_log")
    .insert({
      profile_id,
      date: data.date,
      activity_type: data.activity_type,
      duration_min: data.duration_min,
      intensity: data.intensity ?? null,
      notes: data.notes ?? null,
    })
    .select("id")
    .single();
  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Insert failed" };
  }

  const activity_log_id = inserted.id as number;
  await rewardActivityLog({
    profile_id,
    activity_log_id,
    activity_type: data.activity_type,
  });

  return { ok: true, id: activity_log_id };
}

export async function removeActivity(
  input: z.infer<typeof RemoveInput>,
): Promise<RemoveResult> {
  await requireSlug();

  const parsed = RemoveInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Input inválido" };
  const data = parsed.data;

  const profile_id = await slugToUuid(data.profile);
  if (!profile_id) return { ok: false, error: "Perfil no encontrado" };

  const sb = getServerSupabase();
  const { error } = await sb
    .from("activity_log")
    .delete()
    .eq("id", data.id)
    .eq("profile_id", profile_id); // solo borras tus propios logs
  if (error) return { ok: false, error: error.message };

  // NO revertimos el xp_event correspondiente (política consistente con
  // checks: el desmarcado no quita XP en v1). El user perderá el log de
  // historial pero conserva el XP. F11 puede agregar revert.
  return { ok: true };
}
