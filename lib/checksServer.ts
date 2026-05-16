import "server-only";
import { getServerSupabase } from "./supabase";
import { slugToUuid } from "./profileServer";
import type { ProfileId } from "./types";

// Helpers de servidor para gestión de checks (lectura y utilidades).
// Las mutaciones viven en lib/actions/checks.ts.


/**
 * Convierte una lista de IDs en un Record de checks para el componente CheckList.
 */
export async function asRecord(ids: string[]): Promise<Record<string, boolean>> {
  const record: Record<string, boolean> = {};
  ids.forEach((id) => {
    record[id] = true;
  });
  return record;
}

/**
 * Obtiene los checks de prep de la semana.
 */
export async function getPrepChecked(slug: ProfileId, week_start: string): Promise<string[]> {
  const profile_id = await slugToUuid(slug);
  if (!profile_id) return [];

  const sb = getServerSupabase();
  const { data } = await sb
    .from("prep_check")
    .select("task_id")
    .eq("profile_id", profile_id)
    .eq("week_start", week_start);

  return data?.map((d) => d.task_id) ?? [];
}

/**
 * Query genérica para obtener un set de checks como Record<string, boolean>.
 */
export async function getCheckedSet(params: {
  profile: ProfileId;
  table: "meals_log" | "shopping_check" | "prep_check";
  date?: string;
  week_start?: string;
}): Promise<Record<string, boolean>> {
  const profile_id = await slugToUuid(params.profile);
  if (!profile_id) return {};

  const sb = getServerSupabase();
  let query = sb.from(params.table).select("*").eq("profile_id", profile_id);

  if (params.date) query = query.eq("date", params.date);
  if (params.week_start) query = query.eq("week_start", params.week_start);

  const { data } = await query;
  if (!data) return {};

  const record: Record<string, boolean> = {};
  data.forEach((d: any) => {
    const key = d.meal_id || d.item_id || d.task_id;
    if (key) record[key] = true;
  });

  return record;
}
