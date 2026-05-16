import "server-only";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import type { ProfileId } from "@/lib/types";

/**
 * Recolecta toda la data relevante de una semana para que Claude la
 * use en el weekly review. Mantenemos los campos COMPACTOS para
 * minimizar tokens del prompt.
 *
 * week_start es el LUNES de la semana (YYYY-MM-DD). Cubre 7 días
 * lun→dom inclusive.
 */

export type WeekData = {
  profile: {
    slug: ProfileId;
    display_name: string;
    baseline_kcal: number | null;
    baseline_protein_g: number | null;
    goal: string | null;
    dietary_tags: string[];
    notes_for_ai: string | null;
  };
  week_start: string;
  week_end: string;
  meals: Array<{
    date: string;
    meal_id: string;
    name: string | null;
    kcal: number | null;
    protein_g: number | null;
    hunger_after: number | null;
  }>;
  exercises: Array<{
    date: string;
    exercise_id: string;
    sets: Array<{ reps: number; weight_kg?: number; rpe?: number }>;
    total_volume_kg: number;
    avg_rpe: number | null;
  }>;
  activities: Array<{
    date: string;
    type: string;
    duration_min: number;
    intensity: number | null;
  }>;
  weights: Array<{ date: string; weight_kg: number }>;
  photos: Array<{
    taken_on: string;
    pose_quality: string | null;
    observations_summary: string | null;
    visible_areas: string[];
  }>;
  streak: {
    current: number;
    longest: number;
    days_active_this_week: number;
  };
};

function plusDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function collectWeekData(
  slug: ProfileId,
  week_start: string,
): Promise<WeekData | null> {
  const profile_id = await slugToUuid(slug);
  if (!profile_id) return null;

  const sb = getServerSupabase();
  const week_end = plusDaysISO(week_start, 6);

  const [profileRow, mealsRows, exercisesRows, activitiesRows, weightsRows, photosRows, streakRow] =
    await Promise.all([
      sb
        .from("profiles")
        .select("display_name, baseline_kcal, baseline_protein_g, goal, dietary_tags, notes_for_ai")
        .eq("id", profile_id)
        .single(),
      sb
        .from("meals_log")
        .select("date, meal_id, meal_snapshot, hunger_after")
        .eq("profile_id", profile_id)
        .gte("date", week_start)
        .lte("date", week_end)
        .eq("completed", true),
      sb
        .from("exercises_log")
        .select("date, exercise_id, sets")
        .eq("profile_id", profile_id)
        .gte("date", week_start)
        .lte("date", week_end),
      sb
        .from("activity_log")
        .select("date, activity_type, duration_min, intensity")
        .eq("profile_id", profile_id)
        .gte("date", week_start)
        .lte("date", week_end),
      sb
        .from("weight_log")
        .select("date, weight_kg")
        .eq("profile_id", profile_id)
        .gte("date", week_start)
        .lte("date", week_end)
        .order("date", { ascending: true }),
      sb
        .from("body_photos")
        .select("taken_on, ai_analysis")
        .eq("profile_id", profile_id)
        .gte("taken_on", week_start)
        .lte("taken_on", week_end)
        .order("taken_on", { ascending: true }),
      sb
        .from("streaks")
        .select("current, longest")
        .eq("profile_id", profile_id)
        .single(),
    ]);

  if (profileRow.error || !profileRow.data) return null;

  const meals = (mealsRows.data ?? []).map((m) => {
    const snap = m.meal_snapshot as null | {
      name?: string;
      kcal?: number;
      proteinG?: number;
    };
    return {
      date: m.date as string,
      meal_id: m.meal_id as string,
      name: snap?.name ?? null,
      kcal: snap?.kcal ?? null,
      protein_g: snap?.proteinG ?? null,
      hunger_after: (m.hunger_after as number | null) ?? null,
    };
  });

  const exercises = (exercisesRows.data ?? []).map((r) => {
    const sets = (r.sets as Array<{
      reps: number;
      weight_kg?: number;
      rpe?: number;
    }>) ?? [];
    const total_volume_kg = sets.reduce(
      (acc, s) => acc + s.reps * (s.weight_kg ?? 0),
      0,
    );
    const rpes = sets
      .map((s) => s.rpe)
      .filter((x): x is number => typeof x === "number");
    const avg_rpe =
      rpes.length === 0 ? null : rpes.reduce((a, b) => a + b, 0) / rpes.length;
    return {
      date: r.date as string,
      exercise_id: r.exercise_id as string,
      sets,
      total_volume_kg,
      avg_rpe,
    };
  });

  const activities = (activitiesRows.data ?? []).map((a) => ({
    date: a.date as string,
    type: a.activity_type as string,
    duration_min: a.duration_min as number,
    intensity: (a.intensity as number | null) ?? null,
  }));

  const weights = (weightsRows.data ?? []).map((w) => ({
    date: w.date as string,
    weight_kg: Number(w.weight_kg),
  }));

  const photos = (photosRows.data ?? []).map((p) => {
    const a = p.ai_analysis as null | {
      pose_quality?: string;
      visible_areas?: string[];
      observations?: {
        posture?: string;
        muscle_definition?: string;
        body_composition?: string;
      };
    };
    const obs = a?.observations;
    const observations_summary = obs
      ? [obs.posture, obs.muscle_definition, obs.body_composition]
          .filter(Boolean)
          .join(" · ") || null
      : null;
    return {
      taken_on: p.taken_on as string,
      pose_quality: a?.pose_quality ?? null,
      observations_summary,
      visible_areas: a?.visible_areas ?? [],
    };
  });

  // Días con ≥1 meal marcada esta semana
  const days_active_this_week = new Set(meals.map((m) => m.date)).size;

  return {
    profile: {
      slug,
      display_name: (profileRow.data.display_name as string) ?? slug,
      baseline_kcal: (profileRow.data.baseline_kcal as number | null) ?? null,
      baseline_protein_g:
        (profileRow.data.baseline_protein_g as number | null) ?? null,
      goal: (profileRow.data.goal as string | null) ?? null,
      dietary_tags: (profileRow.data.dietary_tags as string[]) ?? [],
      notes_for_ai: (profileRow.data.notes_for_ai as string | null) ?? null,
    },
    week_start,
    week_end,
    meals,
    exercises,
    activities,
    weights,
    photos,
    streak: {
      current: (streakRow.data?.current as number | undefined) ?? 0,
      longest: (streakRow.data?.longest as number | undefined) ?? 0,
      days_active_this_week,
    },
  };
}
