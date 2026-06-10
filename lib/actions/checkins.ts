"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcularCheckin, type Metricas } from "@/lib/scoring";
import { CAP_PUNTOS_DIA } from "@/lib/scoring/constants";
import { sendPushToComembers } from "@/lib/push/send";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export async function crearCheckin(input: {
  miembroId: string;
  actividadId: string;
  fecha: string; // YYYY-MM-DD
  metricas: Metricas;
  duracionMin: number;
}): Promise<Result<{ puntos: number }>> {
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

  // Cap diario por miembro: no exceder CAP_PUNTOS_DIA de puntos crudos/día. Si se
  // pasa, se trunca puntos y se escalan los deltas en proporción (consistencia).
  let puntos = score.puntos;
  let deltas: Record<string, number> = score.deltas;
  const { data: previos } = await supabase
    .schema("core")
    .from("checkins")
    .select("puntos_base")
    .eq("miembro_id", input.miembroId)
    .eq("fecha", input.fecha);
  const acumulado = (previos ?? []).reduce(
    (s, r) => s + Number((r as { puntos_base: number | null }).puntos_base ?? 0),
    0,
  );
  const restante = Math.max(0, CAP_PUNTOS_DIA - acumulado);
  if (puntos > restante) {
    const factor = puntos > 0 ? restante / puntos : 0;
    puntos = Math.round(restante);
    deltas = Object.fromEntries(
      Object.entries(score.deltas).map(([k, v]) => [k, Math.round(v * factor * 100) / 100]),
    );
  }

  const { error } = await supabase.schema("core").rpc("apply_checkin", {
    p_miembro_id: input.miembroId,
    p_actividad_id: input.actividadId,
    p_fecha: input.fecha,
    p_metricas: input.metricas,
    p_kcal: score.kcal,
    p_puntos: puntos,
    p_deltas: deltas,
  });
  if (error) return { ok: false, error: error.message };

  // F8 · "tu compañero entrenó" — push al resto del dúo. El helper NUNCA lanza y sin
  // VAPID keys es no-op inmediato: jamás afecta el check-in.
  const { data: miembroRow } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("trato_id, users!inner(nombre)")
    .eq("id", input.miembroId)
    .maybeSingle();
  const miembro = miembroRow as unknown as
    | { trato_id: string; users: { nombre: string } | null }
    | null;
  if (miembro?.trato_id) {
    await sendPushToComembers(miembro.trato_id, user.id, "checkin_companero", {
      title: "dovo",
      body: `${miembro.users?.nombre ?? "tu compañero"} ya entrenó hoy — te toca.`,
      url: "/",
      tag: "checkin-duo",
    });
  }

  revalidatePath("/");
  // Los puntos ganados vuelven al cliente: el momento de recompensa se CELEBRA en la UI
  // (game-feel F12), no se pierde en silencio.
  return { ok: true, data: { puntos: Math.round(puntos) } };
}
