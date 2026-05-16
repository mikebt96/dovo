import "server-only";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import type { ProfileId } from "@/lib/types";

/**
 * Estado del log de ejercicios de un día específico, indexado por exercise_id.
 *
 * El shape matches LogEntry del componente ExerciseLogger — strings, no
 * numbers, porque los inputs del form son texto y aceptamos vacíos. La
 * conversión a números canónicos pasa en el server action al persistir.
 *
 * Resiliente: si DB no responde, devuelve {} (modo localStorage-only sigue
 * funcionando).
 */
export type ExerciseLogState = {
  done: boolean;
  topSet?: { weight?: string; reps?: string; rpe?: string };
  notes?: string;
};

type ExerciseSetRow = {
  weight_kg?: number | null;
  reps?: number | null;
  rpe?: number | null;
};

export async function getExercisesLogged(
  slug: ProfileId,
  date: string,
): Promise<Record<string, ExerciseLogState>> {
  try {
    const profile_id = await slugToUuid(slug);
    if (!profile_id) return {};

    const sb = getServerSupabase();
    const { data, error } = await sb
      .from("exercises_log")
      .select("exercise_id, sets, notes")
      .eq("profile_id", profile_id)
      .eq("date", date);

    if (error) {
      console.warn("[queries/exercises] read failed:", error.message);
      return {};
    }

    const out: Record<string, ExerciseLogState> = {};
    for (const row of data ?? []) {
      const sets = (row.sets as ExerciseSetRow[] | null) ?? [];
      const top = sets[0];
      out[row.exercise_id as string] = {
        done: true,
        topSet: top
          ? {
              weight: top.weight_kg != null ? String(top.weight_kg) : undefined,
              reps: top.reps != null ? String(top.reps) : undefined,
              rpe: top.rpe != null ? String(top.rpe) : undefined,
            }
          : undefined,
        notes: (row.notes as string | undefined) ?? undefined,
      };
    }
    return out;
  } catch (err) {
    console.warn("[queries/exercises] threw:", err);
    return {};
  }
}
