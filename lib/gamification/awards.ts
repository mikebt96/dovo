import "server-only";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import { getMealsFor } from "@/lib/data/meals";
import { isoWeek } from "@/lib/dates";
import type { ProfileId, DayKey } from "@/lib/types";
import {
  COINS_DAY_COMPLETE,
  COINS_PAIR_BONUS,
  XP_DAY_COMPLETE_BONUS,
  XP_PAIR_BONUS,
  XP_PER_ACTIVITY,
  XP_PER_EXERCISE,
  XP_PER_MEAL,
  levelFromXp,
} from "./config";

/**
 * Awards helpers — server-only, NO Server Actions (son utilities internas
 * que se llaman desde otros Server Actions). Cada función falla suave:
 * log + return en lugar de throw, así un error en gamification no rompe
 * la mutation principal (UX nunca debería ver explosión de coins).
 *
 * Idempotencia: todo award define un `source_ref` único. El UNIQUE INDEX
 * en xp_events (migration 005) garantiza que reintentos no doblan el XP.
 * Manejamos código de error Postgres 23505 (unique_violation) como no-op.
 */

const PG_UNIQUE_VIOLATION = "23505";
const PARTNER_OF: Record<ProfileId, ProfileId> = { mike: "andy", andy: "mike" };

/* ------------------------------------------------------------------ */
/*  Primitivas                                                         */
/* ------------------------------------------------------------------ */

/**
 * Inserta un xp_event Y actualiza xp.total/level si el evento es nuevo.
 * Si el source_ref ya existe (23505), no-op silencioso.
 */
async function awardXp(args: {
  profile_id: string;
  amount: number;
  source: string;
  source_ref: string;
  payload?: Record<string, unknown>;
}): Promise<{ awarded: boolean }> {
  const sb = getServerSupabase();

  const { error: insertErr } = await sb.from("xp_events").insert({
    profile_id: args.profile_id,
    amount: args.amount,
    source: args.source,
    source_ref: args.source_ref,
    payload: args.payload ?? null,
  });

  if (insertErr) {
    if (insertErr.code === PG_UNIQUE_VIOLATION) return { awarded: false };
    console.warn(`[awardXp] insert failed: ${insertErr.message}`);
    return { awarded: false };
  }

  // Actualizar xp.total y level (no atomic con el insert; en v1 lo aceptamos)
  const { data: row, error: selectErr } = await sb
    .from("xp")
    .select("total")
    .eq("profile_id", args.profile_id)
    .single();
  if (selectErr || !row) {
    console.warn(`[awardXp] read total failed`);
    return { awarded: true };
  }
  const newTotal = (row.total as number) + args.amount;
  const { error: updErr } = await sb
    .from("xp")
    .update({
      total: newTotal,
      level: levelFromXp(newTotal),
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", args.profile_id);
  if (updErr) console.warn(`[awardXp] xp update failed: ${updErr.message}`);

  return { awarded: true };
}

async function awardCoins(profile_id: string, amount: number): Promise<void> {
  const sb = getServerSupabase();
  const { data: row, error } = await sb
    .from("coins")
    .select("balance")
    .eq("profile_id", profile_id)
    .single();
  if (error || !row) {
    console.warn(`[awardCoins] read failed: ${error?.message ?? "no row"}`);
    return;
  }
  const newBal = (row.balance as number) + amount;
  const { error: updErr } = await sb
    .from("coins")
    .update({ balance: newBal, updated_at: new Date().toISOString() })
    .eq("profile_id", profile_id);
  if (updErr) console.warn(`[awardCoins] update failed: ${updErr.message}`);
}

/* ------------------------------------------------------------------ */
/*  Streak                                                             */
/* ------------------------------------------------------------------ */

function parseDateISO(s: string): Date {
  // Forzar mediodía UTC para evitar DST jitter en sumas de días.
  return new Date(`${s}T12:00:00Z`);
}

function daysBetween(aIso: string, bIso: string): number {
  const ms = parseDateISO(bIso).getTime() - parseDateISO(aIso).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

async function incrementStreakOnDayComplete(
  profile_id: string,
  date: string,
): Promise<void> {
  const sb = getServerSupabase();
  const { data: s, error } = await sb
    .from("streaks")
    .select("current, longest, last_active_date, freezes_available")
    .eq("profile_id", profile_id)
    .single();
  if (error || !s) {
    console.warn(`[streak] read failed: ${error?.message}`);
    return;
  }

  const lastDate = (s.last_active_date as string | null) ?? null;
  if (lastDate === date) return; // ya contamos hoy, no-op

  let current = s.current as number;
  let longest = s.longest as number;
  let freezes = s.freezes_available as number;

  if (lastDate === null) {
    // Primer día activo — arrancar streak
    current = 1;
  } else {
    const diff = daysBetween(lastDate, date);
    if (diff === 1) {
      current += 1;
    } else if (diff > 1 && freezes > 0) {
      freezes -= 1;
      current += 1; // freeze rescata
    } else {
      current = 1; // rompió, hoy es día 1
    }
    // Reset freezes al cruzar semana ISO (max 1 disponible)
    if (isoWeek(parseDateISO(date)) !== isoWeek(parseDateISO(lastDate))) {
      freezes = Math.max(freezes, 1);
    }
  }

  longest = Math.max(longest, current);

  const { error: updErr } = await sb
    .from("streaks")
    .update({
      current,
      longest,
      last_active_date: date,
      freezes_available: freezes,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profile_id);
  if (updErr) console.warn(`[streak] update failed: ${updErr.message}`);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/** Award por marcar 1 meal. Idempotente: source_ref = meal:{meal_id}:{date} */
export async function rewardMealCheck(args: {
  profile: ProfileId;
  profile_id: string;
  meal_id: string;
  date: string;
}): Promise<void> {
  await awardXp({
    profile_id: args.profile_id,
    amount: XP_PER_MEAL,
    source: "meal",
    source_ref: `meal:${args.meal_id}:${args.date}`,
    payload: { kind: "meal", meal_id: args.meal_id },
  });
}

/** Award por loggear 1 ejercicio (gym). Idempotente por exercise_id × date. */
export async function rewardExerciseLog(args: {
  profile_id: string;
  exercise_id: string;
  date: string;
  total_volume_kg?: number;
}): Promise<void> {
  await awardXp({
    profile_id: args.profile_id,
    amount: XP_PER_EXERCISE,
    source: "exercise",
    source_ref: `exercise:${args.exercise_id}:${args.date}`,
    payload: {
      kind: "exercise",
      exercise_id: args.exercise_id,
      total_volume_kg: args.total_volume_kg,
    },
  });
}

/** Award por loggear 1 sesión de actividad (ballet/pilates/run/etc).
 *  Idempotente por activity row uuid (cada sesión es única). */
export async function rewardActivityLog(args: {
  profile_id: string;
  activity_log_id: number;
  activity_type: string;
}): Promise<void> {
  await awardXp({
    profile_id: args.profile_id,
    amount: XP_PER_ACTIVITY,
    source: "activity",
    source_ref: `activity:${args.activity_log_id}`,
    payload: {
      kind: "activity" as const,
      activity_id: String(args.activity_log_id),
      activity_type: args.activity_type,
    } as unknown as Record<string, unknown>,
  });
}

/**
 * Chequea si todas las meals planeadas del día están marcadas. Si sí:
 *   - Award day_complete XP + coins (idempotente por source_ref)
 *   - Incrementa streak (idempotente por last_active_date check)
 *   - Intenta pair bonus si el partner también completó este date
 */
export async function maybeAwardDayComplete(args: {
  profile: ProfileId;
  profile_id: string;
  date: string;
  day_key: DayKey;
}): Promise<void> {
  const sb = getServerSupabase();

  const plannedMeals = getMealsFor(args.profile, args.day_key);
  if (plannedMeals.length === 0) return; // sin meals = nada que completar

  const { data: logged, error } = await sb
    .from("meals_log")
    .select("meal_id")
    .eq("profile_id", args.profile_id)
    .eq("date", args.date)
    .eq("completed", true);
  if (error) {
    console.warn(`[dayComplete] count failed: ${error.message}`);
    return;
  }
  const completedIds = new Set((logged ?? []).map((r) => r.meal_id as string));
  const allDone = plannedMeals.every((m) => completedIds.has(m.id));
  if (!allDone) return;

  const { awarded } = await awardXp({
    profile_id: args.profile_id,
    amount: XP_DAY_COMPLETE_BONUS,
    source: "day_complete",
    source_ref: `day_complete:${args.date}`,
    payload: {
      kind: "day_complete",
      date: args.date,
      components_completed: ["meals"],
    },
  });
  if (!awarded) return; // ya se otorgó antes — todo lo demás también es no-op

  await awardCoins(args.profile_id, COINS_DAY_COMPLETE);
  await incrementStreakOnDayComplete(args.profile_id, args.date);

  // Intentar pair bonus (revisa si el partner también ya tiene day_complete)
  await maybeAwardPairBonus(args.profile, args.date);
}

async function maybeAwardPairBonus(
  triggering: ProfileId,
  date: string,
): Promise<void> {
  const partner: ProfileId = PARTNER_OF[triggering];
  const sb = getServerSupabase();

  // ¿El partner tiene day_complete en este date?
  const partnerUuid = await slugToUuid(partner);
  if (!partnerUuid) return;

  const { data: partnerDayComplete } = await sb
    .from("xp_events")
    .select("id")
    .eq("profile_id", partnerUuid)
    .eq("source", "day_complete")
    .eq("source_ref", `day_complete:${date}`)
    .maybeSingle();
  if (!partnerDayComplete) return; // partner aún no completa este día

  // Award a ambos. UNIQUE constraint hace cada uno idempotente.
  const triggeringUuid = await slugToUuid(triggering);
  if (!triggeringUuid) return;

  const sourceRef = `pair_bonus:${date}`;
  for (const [slug, uuid] of [
    [triggering, triggeringUuid] as const,
    [partner, partnerUuid] as const,
  ]) {
    const { awarded } = await awardXp({
      profile_id: uuid,
      amount: XP_PAIR_BONUS,
      source: "pair_bonus",
      source_ref: sourceRef,
      payload: { kind: "pair_bonus", partner_slug: slug, date },
    });
    if (awarded) {
      await awardCoins(uuid, COINS_PAIR_BONUS);
    }
  }
}
