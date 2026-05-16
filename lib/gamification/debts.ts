import "server-only";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import { isoWeek, parseISODate, todayISO } from "@/lib/dates";
import type { ProfileId } from "@/lib/types";

/**
 * Pair debts: cuando uno del dúo rompe racha, le debe penalty al otro.
 *
 * Detección (lazy + cron):
 *   - El cron midnight evalúa cada profile: si last_active_date está MÁS
 *     allá del límite de freeze, crea un debt y resetea current=0.
 *   - Importante: el cron NO incrementa el streak; eso lo hace el
 *     incrementStreakOnDayComplete cuando el user marca día completo.
 *     Aquí solo manejamos la trayectoria descendente.
 *
 * Asignación de penalty:
 *   - Auto-asignamos una penalty random severity=1 (mild). El partner
 *     puede cambiarla desde /duo antes de marcarla como paid (más sano:
 *     da control humano sobre el castigo, no dictatorial).
 *   - Si no hay penalties severity=1 disponibles, queda penalty_id=NULL
 *     y la UI pide al partner elegir antes de marcar pagada.
 */

const PARTNER_OF: Record<ProfileId, ProfileId> = { mike: "andy", andy: "mike" };

const PARTNER_SLUG_FROM_PROFILES: Record<string, ProfileId> = {};

/** Pick aleatorio de penalty del catalog, filtrado por severity. */
async function pickRandomPenalty(severity: number): Promise<number | null> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("penalties_catalog")
    .select("id")
    .eq("severity", severity)
    .eq("active", true);
  if (error || !data || data.length === 0) return null;
  const row = data[Math.floor(Math.random() * data.length)];
  return row.id as number;
}

/**
 * Crea una pair_debt cuando `debtor` rompió racha. Idempotente por
 * (debtor_id, due_by) — no creamos múltiples debts por el mismo día.
 */
async function createDebtIfMissing(args: {
  debtor: ProfileId;
  creditor: ProfileId;
  due_by: string;             // YYYY-MM-DD (día en que se detectó el break)
  reason: string;
}): Promise<{ created: boolean }> {
  const sb = getServerSupabase();
  const debtor_id = await slugToUuid(args.debtor);
  const creditor_id = await slugToUuid(args.creditor);
  if (!debtor_id || !creditor_id) return { created: false };

  // Idempotencia: ¿ya existe un debt pending para este (debtor, due_by)?
  const { data: existing } = await sb
    .from("pair_debts")
    .select("id")
    .eq("debtor", debtor_id)
    .eq("due_by", args.due_by)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return { created: false };

  const penalty_id = await pickRandomPenalty(1); // mild por default
  const { error } = await sb.from("pair_debts").insert({
    debtor: debtor_id,
    creditor: creditor_id,
    penalty_id,
    reason: args.reason,
    status: "pending",
    due_by: args.due_by,
  });
  if (error) {
    console.warn(`[debts] insert failed: ${error.message}`);
    return { created: false };
  }
  return { created: true };
}

/**
 * Llamado por el cron a la medianoche MX.
 * Lógica:
 *   1. Lee el streak del slug.
 *   2. Si last_active_date = ayer → no hubo break, no-op.
 *   3. Si last_active_date < ayer Y current > 0 → BREAK.
 *      a. Si freezes_available > 0 → consume freeze, current se mantiene.
 *      b. Si NO → crea debt, resetea current=0, longest queda intacto.
 *   4. Si last_active_date < ayer Y current == 0 → ya estaba roto, no-op.
 */
export async function resolveStreakAtMidnight(slug: ProfileId): Promise<{
  outcome: "noop" | "freezed" | "broke";
  debtCreated?: boolean;
}> {
  const sb = getServerSupabase();
  const profile_id = await slugToUuid(slug);
  if (!profile_id) return { outcome: "noop" };

  const { data: s } = await sb
    .from("streaks")
    .select("current, longest, last_active_date, freezes_available")
    .eq("profile_id", profile_id)
    .maybeSingle();
  if (!s) return { outcome: "noop" };

  const last = (s.last_active_date as string | null) ?? null;
  const current = (s.current as number) ?? 0;
  const longest = (s.longest as number) ?? 0;
  const freezes = (s.freezes_available as number) ?? 0;

  if (!last || current === 0) return { outcome: "noop" };

  const today = todayISO();
  const yesterday = (() => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  // Streak vigente (último día activo es hoy o ayer) → no-op.
  if (last === today || last === yesterday) return { outcome: "noop" };

  // Gap detectado. ¿Hay freeze disponible?
  if (freezes > 0) {
    // Consume freeze. last_active_date NO se actualiza (necesita marca real
    // para "habitar" un nuevo día). Pero registramos el uso del freeze.
    const { error } = await sb
      .from("streaks")
      .update({
        freezes_available: freezes - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", profile_id);
    if (error) console.warn(`[debts] freeze consume failed: ${error.message}`);
    return { outcome: "freezed" };
  }

  // BREAK: reset streak + crear debt
  const { error: resetErr } = await sb
    .from("streaks")
    .update({
      current: 0,
      // longest queda preservado para historia
      // freezes_available se reseteará al cruzar la siguiente semana
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profile_id);
  if (resetErr) console.warn(`[debts] reset failed: ${resetErr.message}`);

  // Reset weekly freezes si cruzó la semana ISO
  if (
    last &&
    isoWeek(parseISODate(today)) !== isoWeek(parseISODate(last))
  ) {
    await sb
      .from("streaks")
      .update({ freezes_available: 1 })
      .eq("profile_id", profile_id);
  }

  const partner = PARTNER_OF[slug];
  const { created } = await createDebtIfMissing({
    debtor: slug,
    creditor: partner,
    due_by: today,
    reason: `Rompió racha de ${current} días (récord ${longest}).`,
  });

  return { outcome: "broke", debtCreated: created };
}
