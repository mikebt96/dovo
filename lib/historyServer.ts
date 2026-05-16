import { getServerSupabase } from "./supabase";
import { slugToUuid } from "./profileServer";
import { mondayOf, parseISODate, dayKeyOf } from "./dates";
import { MEALS } from "./data/meals";
import type { DayKey, ProfileId } from "./types";

interface MealSnapshot {
  name?: string;
  ingredients?: string;
  kcal?: number;
  proteinG?: number;
  replanned?: boolean;
}

export interface WeekConsumption {
  weekStart: string;                       // YYYY-MM-DD (lunes)
  kcalReal: number;                        // suma de snapshots completados
  proteinReal: number;
  mealsLogged: number;
  byDay: Record<DayKey, { kcal: number; proteinG: number; meals: number }>;
}

const EMPTY_DAY = { kcal: 0, proteinG: 0, meals: 0 };

/**
 * Lee `meals_log` de la semana actual (desde lunes) y agrega los snapshots.
 *
 * Para filas sin `meal_snapshot` (logs pre-#4), hace fallback al `MEALS` seed
 * — así el agregado sigue siendo útil aunque la mitad sea histórico viejo.
 */
export async function getWeekConsumption(
  slug: ProfileId
): Promise<WeekConsumption> {
  const weekStart = mondayOf();
  const empty: WeekConsumption = {
    weekStart,
    kcalReal: 0,
    proteinReal: 0,
    mealsLogged: 0,
    byDay: {
      lun: { ...EMPTY_DAY },
      mar: { ...EMPTY_DAY },
      mie: { ...EMPTY_DAY },
      jue: { ...EMPTY_DAY },
      vie: { ...EMPTY_DAY },
      sab: { ...EMPTY_DAY },
      dom: { ...EMPTY_DAY },
    },
  };

  const uuid = await slugToUuid(slug);
  if (!uuid) return empty;

  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("meals_log")
    .select("date, meal_id, completed, meal_snapshot")
    .eq("profile_id", uuid)
    .gte("date", weekStart)
    .eq("completed", true);

  if (error || !data) return empty;

  // Index MEALS para fallback de logs antiguos
  const mealsById = new Map(MEALS.map((m) => [m.id, m]));

  for (const row of data) {
    const snap = (row.meal_snapshot ?? null) as MealSnapshot | null;
    const seed = mealsById.get(row.meal_id as string);
    const kcal = snap?.kcal ?? seed?.kcal ?? 0;
    const proteinG = snap?.proteinG ?? seed?.proteinG ?? 0;

    empty.kcalReal += kcal;
    empty.proteinReal += proteinG;
    empty.mealsLogged += 1;

    const dayKey = dayKeyOf(parseISODate(row.date as string));
    const bucket = empty.byDay[dayKey];
    bucket.kcal += kcal;
    bucket.proteinG += proteinG;
    bucket.meals += 1;
  }

  return empty;
}
