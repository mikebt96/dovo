import "server-only";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import { getMealsFor } from "@/lib/data/meals";
import { dayKeyOf, parseISODate, todayISO } from "@/lib/dates";
import type { ProfileId } from "@/lib/types";

export interface StreakStats {
  current: number;
  longest: number;
  lastActiveDate: string | null; // YYYY-MM-DD
}

const EMPTY_STREAK: StreakStats = {
  current: 0,
  longest: 0,
  lastActiveDate: null,
};

/**
 * Umbral para considerar un día completo. v1 solo lee `meals_log`.
 * ≥75% de comidas marcadas = "el día se cumplió".
 * Cuando los ejercicios + actividades estén wired, este umbral se ajusta
 * para promediar las 3 fuentes.
 */
const DAY_COMPLETE_THRESHOLD = 0.75;

/** Cuántos días hacia atrás miramos. 90 cubre los milestones (7/14/30) con margen. */
const LOOKBACK_DAYS = 90;

/**
 * Calcula la racha actual + récord para un perfil leyendo `meals_log`.
 *
 * Algoritmo:
 *   1. Trae todos los meals marcados últimos 90 días.
 *   2. Agrupa por fecha → Set<meal_id>.
 *   3. Para cada fecha, decide día completo = marcados/esperados ≥ 0.75.
 *   4. current = racha que termina hoy O ayer (24h de gracia).
 *   5. longest = max racha en los 90 días.
 *
 * Resiliente: si DB no responde (sin .env.local en dev) devuelve EMPTY_STREAK.
 */
export async function computeStreak(slug: ProfileId): Promise<StreakStats> {
  try {
    const profileId = await slugToUuid(slug);
    if (!profileId) return EMPTY_STREAK;

    const sb = getServerSupabase();
    const today = new Date();
    const since = new Date(today);
    since.setDate(since.getDate() - LOOKBACK_DAYS);
    const sinceISO = todayISO(since);

    const { data, error } = await sb
      .from("meals_log")
      .select("date, meal_id")
      .eq("profile_id", profileId)
      .eq("completed", true)
      .gte("date", sinceISO);

    if (error) {
      console.warn(`[streaks] meals_log query failed for ${slug}:`, error.message);
      return EMPTY_STREAK;
    }

    // Agrupar marcas por fecha → Set<meal_id>
    const markedByDate = new Map<string, Set<string>>();
    for (const row of data ?? []) {
      const set = markedByDate.get(row.date) ?? new Set<string>();
      set.add(row.meal_id);
      markedByDate.set(row.date, set);
    }

    // Caminar hacia atrás día por día, computar dayComplete[]
    // dayComplete[0] = hoy, dayComplete[1] = ayer, …
    const dayComplete: boolean[] = [];
    let lastActiveDate: string | null = null;

    for (let i = 0; i < LOOKBACK_DAYS; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = todayISO(d);
      const marked = markedByDate.get(iso)?.size ?? 0;
      const expected = getMealsFor(slug, dayKeyOf(d)).length;
      const complete =
        expected > 0 && marked / expected >= DAY_COMPLETE_THRESHOLD;
      dayComplete.push(complete);
      if (complete && lastActiveDate === null) lastActiveDate = iso;
    }

    // current = racha que llega hasta hoy o ayer (24h grace)
    // Si hoy NO está completo pero ayer sí, todavía cuenta la racha previa.
    let current = 0;
    let cursor = 0;
    if (!dayComplete[0] && dayComplete[1]) cursor = 1; // grace de un día
    while (cursor < dayComplete.length && dayComplete[cursor]) {
      current++;
      cursor++;
    }

    // longest = la mayor racha consecutiva dentro del histórico
    let longest = 0;
    let run = 0;
    for (const c of dayComplete) {
      if (c) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
    }

    // Persistir snapshot en `streaks` (best-effort, no falla la lectura)
    await persistStreak(profileId, { current, longest, lastActiveDate }).catch(
      (err) => console.warn(`[streaks] persist failed for ${slug}:`, err),
    );

    return { current, longest, lastActiveDate };
  } catch (err) {
    console.warn(`[streaks] computeStreak threw for ${slug}:`, err);
    return EMPTY_STREAK;
  }
}

/**
 * Racha del dúo. v1: min(Mike, Andy).
 * Razón: si Mike lleva 10 días pero Andy rompió ayer, la racha COMPARTIDA
 * es 0 — porque el día de ayer no se cumplió por ambos. min() captura eso
 * en la mayoría de casos sin necesitar una segunda query.
 *
 * v2: lectura cruzada real ("días donde AMBOS cumplieron"), más justa
 * cuando alguien tiene racha muy larga y el otro arranca.
 */
export async function computePairStreak(
  mikeCurrent: number,
  andyCurrent: number,
): Promise<number> {
  return Math.min(mikeCurrent, andyCurrent);
}

async function persistStreak(
  profileId: string,
  stats: StreakStats,
): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb.from("streaks").upsert(
    {
      profile_id: profileId,
      current: stats.current,
      longest: stats.longest,
      last_active_date: stats.lastActiveDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" },
  );
  if (error) throw error;
}
