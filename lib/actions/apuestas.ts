"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToComembers } from "@/lib/push/send";
import { lunesSemanaCDMX } from "@/lib/workout/fecha";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

// LA APUESTA SEMANAL — el trasfondo de la app: el dúo sella qué se juega esta
// semana (premio conjunto + apuesta interna del que quede abajo). El cierre lo
// dicta el cron del lunes (cerrar_apuestas, tras el Veredicto). La UI solo
// muestra estados reales — jamás inventa quién va ganando.

export type ApuestaRow = {
  id: string;
  trato_id: string;
  week_start: string;
  premio_text: string;
  apuesta_text: string;
  estado: "viva" | "ganada" | "perdida";
  perdedor_interno: string | null;
  saldada: boolean;
};

export type MarcadorInterno = {
  userId: string;
  nombre: string;
  esYo: boolean;
  pts: number; // puntos_base de la semana (normalizados por BMR — justos)
};

export type ApuestaSemana = {
  actual: ApuestaRow | null; // la de ESTA semana
  marcador: MarcadorInterno[]; // quién va arriba/abajo HOY (orden: yo primero)
  // ganada la semana pasada y sin saldar: el recordatorio amistoso
  pendiente: (ApuestaRow & { perdedor_nombre: string | null }) | null;
  rachaTrato: number; // para el catálogo escalonado de premios
};

export async function getApuestaSemana(tratoId: string): Promise<ApuestaSemana | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const semana = lunesSemanaCDMX();
  const pasada = lunesSemanaCDMX(-1);

  const [{ data: filas, error: apErr }, { data: miembros }, { data: streak }] =
    await Promise.all([
      supabase
        .schema("core")
        .from("apuestas")
        .select(
          "id, trato_id, week_start, premio_text, apuesta_text, estado, perdedor_interno, saldada",
        )
        .eq("trato_id", tratoId)
        .in("week_start", [semana, pasada]),
      supabase
        .schema("core")
        .from("trato_miembros")
        .select("id, user_id, users!inner(nombre)")
        .eq("trato_id", tratoId),
      supabase
        .schema("core")
        .from("trato_streak")
        .select("current_streak_weeks")
        .eq("trato_id", tratoId)
        .maybeSingle<{ current_streak_weeks: number }>(),
    ]);
  if (apErr) {
    console.error("[apuestas] semana:", apErr.message);
    return null;
  }

  const rows = (filas ?? []) as ApuestaRow[];
  const actual = rows.find((r) => r.week_start === semana) ?? null;
  const previa = rows.find((r) => r.week_start === pasada) ?? null;

  const ms = (miembros ?? []) as unknown as Array<{
    id: string;
    user_id: string;
    users: { nombre: string } | null;
  }>;

  // marcador interno vivo: puntos_base de la semana por miembro (los checkins
  // del compa son legibles por policy de co-miembros)
  let marcador: MarcadorInterno[] = [];
  if (ms.length) {
    const { data: checks, error: chErr } = await supabase
      .schema("core")
      .from("checkins")
      .select("miembro_id, puntos_base")
      .in(
        "miembro_id",
        ms.map((m) => m.id),
      )
      .gte("fecha", semana)
      .lt("fecha", lunesSemanaCDMX(1));
    if (chErr) console.error("[apuestas] marcador:", chErr.message);
    const porMiembro = new Map<string, number>();
    for (const c of (checks ?? []) as Array<{ miembro_id: string; puntos_base: number | null }>) {
      porMiembro.set(
        c.miembro_id,
        (porMiembro.get(c.miembro_id) ?? 0) + Number(c.puntos_base ?? 0),
      );
    }
    marcador = ms
      .map((m) => ({
        userId: m.user_id,
        nombre: m.users?.nombre ?? "?",
        esYo: m.user_id === user.id,
        pts: Math.round(porMiembro.get(m.id) ?? 0),
      }))
      .sort((a, b) => (a.esYo ? -1 : b.esYo ? 1 : 0));
  }

  const pendiente =
    previa && previa.estado === "ganada" && !previa.saldada && previa.perdedor_interno
      ? {
          ...previa,
          perdedor_nombre:
            ms.find((m) => m.user_id === previa.perdedor_interno)?.users?.nombre ?? null,
        }
      : null;

  return {
    actual,
    marcador,
    pendiente,
    rachaTrato: streak?.current_streak_weeks ?? 0,
  };
}

// Sellar (o re-sellar mientras siga viva) la apuesta de ESTA semana. Cualquier
// miembro del trato puede — el trato ya es consensual; el compa se entera por
// push y la ve en su lobby.
export async function sellarApuesta(input: {
  tratoId: string;
  premio: string;
  apuesta: string;
}): Promise<Result> {
  const premio = input.premio.trim().slice(0, 140);
  const apuesta = input.apuesta.trim().slice(0, 140);
  if (!premio || !apuesta) return { ok: false, error: "premio y apuesta — los dos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const semana = lunesSemanaCDMX();

  // si ya cerró (ganada/perdida) no se reescribe la historia
  const { data: existente } = await supabase
    .schema("core")
    .from("apuestas")
    .select("id, estado")
    .eq("trato_id", input.tratoId)
    .eq("week_start", semana)
    .maybeSingle<{ id: string; estado: string }>();
  if (existente && existente.estado !== "viva") {
    return { ok: false, error: "la apuesta de esta semana ya se cerró" };
  }

  const { error } = existente
    ? await supabase
        .schema("core")
        .from("apuestas")
        .update({ premio_text: premio, apuesta_text: apuesta })
        .eq("id", existente.id)
    : await supabase.schema("core").from("apuestas").insert({
        trato_id: input.tratoId,
        week_start: semana,
        premio_text: premio,
        apuesta_text: apuesta,
        created_by: user.id,
      });
  if (error) return { ok: false, error: error.message };

  // el compa se entera: la apuesta es de los DOS
  const { data: me } = await supabase
    .schema("core")
    .from("users")
    .select("nombre")
    .eq("id", user.id)
    .maybeSingle<{ nombre: string }>();
  await sendPushToComembers(input.tratoId, user.id, "recompensa", {
    title: "dovo · la apuesta",
    body: `${me?.nombre ?? "tu compa"} selló la apuesta: ${premio}. Que gane el trato.`,
    url: "/",
    tag: "apuesta-sellada",
  });

  revalidatePath("/");
  return { ok: true, data: undefined };
}

// "Ya pagó": solo quien NO perdió puede dar por saldada la apuesta (regla del
// consejo: la absolución es del acreedor, jamás del deudor).
export async function marcarApuestaSaldada(apuestaId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data: row } = await supabase
    .schema("core")
    .from("apuestas")
    .select("id, estado, perdedor_interno, saldada")
    .eq("id", apuestaId)
    .maybeSingle<{ id: string; estado: string; perdedor_interno: string | null; saldada: boolean }>();
  if (!row) return { ok: false, error: "apuesta no encontrada" };
  if (row.estado !== "ganada" || row.saldada) return { ok: false, error: "nada que saldar" };
  if (row.perdedor_interno === user.id) {
    return { ok: false, error: "el que debe no se absuelve solo, compa" };
  }

  const { error } = await supabase
    .schema("core")
    .from("apuestas")
    .update({ saldada: true })
    .eq("id", apuestaId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true, data: undefined };
}
