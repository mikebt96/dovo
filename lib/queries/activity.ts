import "server-only";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import type { ProfileId } from "@/lib/types";

/**
 * ¿Hubo al menos una sesión registrada en `activity_log` para este día?
 *
 * Usado por el dashboard cuando el plan del día es actividad alterna
 * (ballet/pilates/running/swimming) en lugar de gym. En esos días
 * `exercises_log` está vacío por diseño — el tracking vive en activity_log.
 *
 * Resiliente: devuelve false si Supabase no responde.
 */
export async function hasActivityLogged(
  slug: ProfileId,
  date: string,
): Promise<boolean> {
  try {
    const profile_id = await slugToUuid(slug);
    if (!profile_id) return false;

    const sb = getServerSupabase();
    const { count, error } = await sb
      .from("activity_log")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile_id)
      .eq("date", date);

    if (error) return false;
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}
