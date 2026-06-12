"use server";

import { createClient } from "@/lib/supabase/server";
import { sendPushToComembers } from "@/lib/push/send";
import { lunesSemanaCDMX } from "@/lib/workout/fecha";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

// ── El party status del juego cooperativo (directiva §4.5 · TratoHUD) ──

export type EstadoMiembro = {
  user_id: string;
  nombre: string;
  freq_objetivo: number;
  checkins_semana: number;
  checkin_hoy: boolean;
  checkin_hoy_sellado: boolean; // candado del lugar: el compa VE el sello
};

export type RachaTrato = {
  current: number;
  max: number;
  last_evaluated_week: string | null;
  last_cumplido_week: string | null;
};

// Estado de TODOS los miembros del trato (RPC definer — la rutina del compa es
// owner-only por RLS; ver migración estado_trato) + racha del trato.
export async function getEstadoTrato(tratoId: string): Promise<{
  miembros: EstadoMiembro[];
  racha: RachaTrato | null;
} | null> {
  const supabase = await createClient();
  const [{ data: miembros, error }, { data: streak }] = await Promise.all([
    supabase.schema("core").rpc("estado_trato", { p_trato_id: tratoId }),
    supabase
      .schema("core")
      .from("trato_streak")
      .select("current_streak_weeks, max_streak, last_evaluated_week, last_cumplido_week")
      .eq("trato_id", tratoId)
      .maybeSingle<{
        current_streak_weeks: number;
        max_streak: number;
        last_evaluated_week: string | null;
        last_cumplido_week: string | null;
      }>(),
  ]);
  if (error) {
    console.error("[trato] estado_trato:", error.message);
    return null;
  }
  return {
    miembros: (miembros ?? []) as EstadoMiembro[],
    racha: streak
      ? {
          current: streak.current_streak_weeks,
          max: streak.max_streak,
          last_evaluated_week: streak.last_evaluated_week,
          last_cumplido_week: streak.last_cumplido_week,
        }
      : null,
  };
}

// Empujón al compa que no ha entrenado hoy. Copy pre-escrito (jamás culpa —
// regla §8.2), pref racha_riesgo, rate-limit v1 en localStorage del cliente +
// tag de push (el SO colapsa repetidos del mismo tag).
export async function nudgeCompa(tratoId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data: me } = await supabase
    .schema("core")
    .from("users")
    .select("nombre")
    .eq("id", user.id)
    .maybeSingle<{ nombre: string }>();

  await sendPushToComembers(tratoId, user.id, "racha_riesgo", {
    title: "dovo",
    body: `${me?.nombre ?? "tu compa"} ya hizo su parte hoy — el trato los necesita a los dos.`,
    url: "/",
    tag: "nudge-trato",
  });
  return { ok: true, data: undefined };
}

// ── El Veredicto del Domingo (directiva §4.14 v1: solo racha) ──

export type Veredicto = {
  tipo: "sellada" | "rota";
  week: string; // lunes ISO de la semana juzgada
  racha: number; // racha tras el veredicto
  record: number; // max_streak (el récord NUNCA se borra — regla §8.6)
  // LA APUESTA de esa semana (si la sellaron): el premio que ganaron juntos
  // y quién paga la apuesta interna. null = no apostaron esa semana.
  apuesta: {
    premio: string;
    apuesta: string;
    perdedorNombre: string | null; // null + ganada = empate digno (nadie paga)
    soyElPerdedor: boolean;
  } | null;
};

// ¿Hay un veredicto fresco (la semana pasada ya fue juzgada por el cron) que
// este usuario aún no ha visto? Una ceremonia por usuario · trato · semana.
export async function getVeredictoPendiente(
  tratoId: string,
): Promise<Veredicto | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const semanaJuzgada = lunesSemanaCDMX(-1);

  const { data: streak } = await supabase
    .schema("core")
    .from("trato_streak")
    .select("current_streak_weeks, max_streak, last_evaluated_week, last_cumplido_week")
    .eq("trato_id", tratoId)
    .maybeSingle<{
      current_streak_weeks: number;
      max_streak: number;
      last_evaluated_week: string | null;
      last_cumplido_week: string | null;
    }>();
  // el cron aún no juzga esa semana (o el trato no tiene historia) → nada
  if (!streak || streak.last_evaluated_week !== semanaJuzgada) return null;

  const { data: visto } = await supabase
    .schema("core")
    .from("veredictos_vistos")
    .select("week")
    .eq("user_id", user.id)
    .eq("trato_id", tratoId)
    .eq("week", semanaJuzgada)
    .maybeSingle<{ week: string }>();
  if (visto) return null;

  // LA APUESTA de la semana juzgada: el premio que se jugaron y quién paga
  const { data: ap } = await supabase
    .schema("core")
    .from("apuestas")
    .select("premio_text, apuesta_text, estado, perdedor_interno")
    .eq("trato_id", tratoId)
    .eq("week_start", semanaJuzgada)
    .maybeSingle<{
      premio_text: string;
      apuesta_text: string;
      estado: string;
      perdedor_interno: string | null;
    }>();

  let apuesta: Veredicto["apuesta"] = null;
  if (ap && ap.estado !== "viva") {
    let perdedorNombre: string | null = null;
    if (ap.perdedor_interno) {
      const { data: p } = await supabase
        .schema("core")
        .from("users")
        .select("nombre")
        .eq("id", ap.perdedor_interno)
        .maybeSingle<{ nombre: string }>();
      perdedorNombre = p?.nombre ?? null;
    }
    apuesta = {
      premio: ap.premio_text,
      apuesta: ap.apuesta_text,
      perdedorNombre,
      soyElPerdedor: ap.perdedor_interno === user.id,
    };
  }

  return {
    tipo: streak.last_cumplido_week === semanaJuzgada ? "sellada" : "rota",
    week: semanaJuzgada,
    racha: streak.current_streak_weeks,
    record: streak.max_streak,
    apuesta,
  };
}

// Marca el veredicto como visto (al abrir la ceremonia — refresh no la repite).
export async function marcarVeredictoVisto(
  tratoId: string,
  week: string,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };
  const { error } = await supabase
    .schema("core")
    .from("veredictos_vistos")
    .insert({ user_id: user.id, trato_id: tratoId, week });
  // 23505 = ya estaba visto (carrera benigna entre tabs)
  if (error && error.code !== "23505") return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}
