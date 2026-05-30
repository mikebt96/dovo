"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcularCheckin, type Metricas } from "@/lib/scoring";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export async function crearCheckin(input: {
  miembroId: string;
  actividadId: string;
  fecha: string; // YYYY-MM-DD
  metricas: Metricas;
  duracionMin: number;
}): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data: actividad } = await supabase
    .schema("core")
    .from("actividades")
    .select("slug, kcal_por_min, stats_primary, stats_secondary")
    .eq("id", input.actividadId)
    .maybeSingle<{
      slug: string;
      kcal_por_min: number;
      stats_primary: string[];
      stats_secondary: string[];
    }>();
  if (!actividad) return { ok: false, error: "actividad inválida" };

  const { data: perfil } = await supabase
    .schema("core")
    .from("user_perfil_fisico")
    .select("peso_kg, bmr_calculado")
    .eq("user_id", user.id)
    .maybeSingle<{ peso_kg: number; bmr_calculado: number | null }>();
  if (!perfil?.bmr_calculado) {
    return { ok: false, error: "completa tu perfil físico primero" };
  }

  const score = calcularCheckin(
    {
      slug: actividad.slug,
      kcal_por_min: Number(actividad.kcal_por_min),
      stats_primary: actividad.stats_primary,
      stats_secondary: actividad.stats_secondary,
    },
    input.metricas,
    { peso_kg: Number(perfil.peso_kg), bmr: Number(perfil.bmr_calculado) },
    input.duracionMin,
  );

  const { error } = await supabase.schema("core").rpc("apply_checkin", {
    p_miembro_id: input.miembroId,
    p_actividad_id: input.actividadId,
    p_fecha: input.fecha,
    p_metricas: input.metricas,
    p_kcal: score.kcal,
    p_puntos: score.puntos,
    p_deltas: score.deltas,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true, data: undefined };
}
