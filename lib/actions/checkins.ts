"use server";

import type { Result } from "@/lib/actions/result";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcularCheckin, type Metricas } from "@/lib/scoring";
import { CAP_PUNTOS_DIA } from "@/lib/scoring/constants";
import type { StatKey } from "@/lib/scoring/types";
import { STAT_KEYS } from "@/lib/scoring/types";
import { characterSheet, type Stats } from "@/lib/leveling";
import { hoyCDMX } from "@/lib/workout/fecha";
import { sendPushToComembers } from "@/lib/push/send";

export type TierUp = { stat: StatKey; de: string; a: string };

// Recibo de esfuerzo (directiva del consejo §4.0): el check-in devuelve TODO lo que
// compró el sudor — sin estos datos, level-up/tier-up/racha son invisibles por
// construcción. Las celebraciones de la UI solo consumen; jamás inventan.
export type CheckinReward = {
  puntos: number;
  boostAplicado: boolean;
  deltas: Record<StatKey, number>; // crudos after − before (capturan el boost)
  nivelAntes: number;
  nivelDespues: number;
  xpParaSiguiente: number;
  progresoNivel: number; // 0..1 dentro del nivel, tras el check-in (barra XP)
  tierUps: TierUp[];
  rachaPersonal: number; // user_streak (la PERSONAL, no la del trato)
  municionLista: boolean; // este check-in ES la munición de hoy (regla getDuelContext)
  sello: boolean; // candado del lugar: la muestra cayó dentro del ancla
  puedeAnclar: boolean; // hubo coords pero no hay ancla → ofrecer anclar
};

// Haversine en metros — el candado compara UNA muestra contra el ancla.
function distanciaM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const ZERO_STATS: Stats = { fue: 0, res: 0, flex: 0, vel: 0, equ: 0, vit: 0 };

type CharacterRow = Stats & { prestige: number };

export async function crearCheckin(input: {
  miembroId: string;
  actividadId: string;
  fecha: string; // YYYY-MM-DD
  metricas: Metricas;
  duracionMin: number;
  // candado del lugar: UNA muestra tomada en el tap (no se persiste — solo el
  // veredicto). Ausente = GPS negado/no disponible ⇒ check-in válido sin sello.
  coords?: { lat: number; lng: number; acc?: number };
}): Promise<Result<CheckinReward>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data: actividad, error: actErr } = await supabase
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
  if (actErr) console.error("[checkins] actividad:", actErr.message);
  if (!actividad) return { ok: false, error: "actividad inválida" };

  const { data: perfil, error: perfErr } = await supabase
    .schema("core")
    .from("user_perfil_fisico")
    .select("peso_kg, bmr_calculado")
    .eq("user_id", user.id)
    .maybeSingle<{ peso_kg: number; bmr_calculado: number | null }>();
  if (perfErr) console.error("[checkins] perfil físico:", perfErr.message);
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

  // Estado BEFORE del personaje: la única forma de saber qué cambió (deltas reales,
  // level-up, tier-ups) es comparar contra el AFTER que devuelve el RPC.
  const { data: beforeRow, error: beforeErr } = await supabase
    .schema("core")
    .from("user_character")
    .select("fue, res, flex, vel, equ, vit, prestige")
    .eq("user_id", user.id)
    .maybeSingle<CharacterRow>();
  if (beforeErr) console.error("[checkins] character before:", beforeErr.message);
  const before: Stats = beforeRow ?? ZERO_STATS;
  const prestige = beforeRow?.prestige ?? 0;

  // Boost energía pendiente: apply_checkin lo consume incondicionalmente si existe,
  // así que su existencia AHORA ⇒ este check-in sale boosteado (+50% a personaje).
  const { data: boostPendiente, error: boostErr } = await supabase
    .schema("core")
    .from("boosts")
    .select("id")
    .eq("para_user", user.id)
    .eq("tipo", "energia")
    .eq("aplicado", false)
    .gt("fecha_expira", new Date().toISOString())
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (boostErr) console.error("[checkins] boost pendiente:", boostErr.message);
  const boostAplicado = !!boostPendiente;

  // Cap diario por miembro: no exceder CAP_PUNTOS_DIA de puntos crudos/día. Si se
  // pasa, se trunca puntos y se escalan los deltas en proporción (consistencia).
  let puntos = score.puntos;
  let deltas: Record<string, number> = score.deltas;
  const { data: previos, error: prevErr } = await supabase
    .schema("core")
    .from("checkins")
    .select("puntos_base")
    .eq("miembro_id", input.miembroId)
    .eq("fecha", input.fecha);
  // F25·G20: si la lectura de previos falla, JAMÁS continuar con acumulado=0 —
  // rompería CAP_PUNTOS_DIA y falsearía municionLista. Mismo trato que el RPC.
  if (prevErr) {
    console.error("[checkins] previos:", prevErr.message);
    return { ok: false, error: prevErr.message };
  }
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

  // Munición del duelo = existir check-in HOY CDMX (regla getDuelContext). Si este
  // es el primero de hoy, este check-in ES el que carga el golpe.
  const municionLista = input.fecha === hoyCDMX() && (previos ?? []).length === 0;

  // ── El candado del lugar: la muestra del tap vs el ancla del jugador ──
  // Sin sello NO se castiga (GPS falla, hay actividades sin lugar fijo): el
  // sello es prueba positiva para el compa, no un gate. La tolerancia absorbe
  // la imprecisión del GPS reportada por el device (cap 75 m — honesta).
  let verificado = false;
  let verifDist: number | null = null;
  let puedeAnclar = false;
  if (
    input.coords &&
    Number.isFinite(input.coords.lat) &&
    Number.isFinite(input.coords.lng)
  ) {
    const { data: lugar } = await supabase
      .schema("core")
      .from("lugares")
      .select("lat, lng, radio_m")
      .eq("user_id", user.id)
      .eq("actividad_id", input.actividadId)
      .maybeSingle<{ lat: number; lng: number; radio_m: number }>();
    if (lugar) {
      verifDist = Math.round(distanciaM(input.coords, lugar));
      const tolerancia = Math.min(Math.max(input.coords.acc ?? 0, 0), 75);
      verificado = verifDist <= lugar.radio_m + tolerancia;
    } else {
      puedeAnclar = true; // hay señal pero no ancla: ofrecer anclar este lugar
    }
  }

  // El RPC devuelve core.user_character AFTER (con deltas boosteados aplicados).
  const { data: afterData, error } = await supabase.schema("core").rpc("apply_checkin", {
    p_miembro_id: input.miembroId,
    p_actividad_id: input.actividadId,
    p_fecha: input.fecha,
    p_metricas: input.metricas,
    p_kcal: score.kcal,
    p_puntos: puntos,
    p_deltas: deltas,
    p_verificado: verificado,
    p_verif_dist_m: verifDist,
  });
  if (error) return { ok: false, error: error.message };

  // PostgREST puede entregar la fila compuesta como objeto o array de 1.
  const afterRaw = (Array.isArray(afterData) ? afterData[0] : afterData) as
    | CharacterRow
    | null
    | undefined;
  const after: Stats = afterRaw
    ? {
        fue: Number(afterRaw.fue),
        res: Number(afterRaw.res),
        flex: Number(afterRaw.flex),
        vel: Number(afterRaw.vel),
        equ: Number(afterRaw.equ),
        vit: Number(afterRaw.vit),
      }
    : // red de seguridad: si el RPC no devolvió fila, aproximamos sin boost
      (Object.fromEntries(
        STAT_KEYS.map((k) => [k, (before[k] || 0) + (Number(deltas[k]) || 0)]),
      ) as Stats);

  const sheetAntes = characterSheet(before, prestige);
  const sheetDespues = characterSheet(after, prestige);
  const deltasReales = Object.fromEntries(
    STAT_KEYS.map((k) => [k, Math.max(0, Math.round(((after[k] || 0) - (before[k] || 0)) * 10) / 10)]),
  ) as Record<StatKey, number>;
  const tierUps: TierUp[] = STAT_KEYS.filter(
    (k) => sheetDespues.tiers[k].index > sheetAntes.tiers[k].index,
  ).map((k) => ({ stat: k, de: sheetAntes.tiers[k].name, a: sheetDespues.tiers[k].name }));

  // Racha personal post-RPC (apply_checkin ya la recalculó).
  const { data: streakRow, error: streakErr } = await supabase
    .schema("core")
    .from("user_streak")
    .select("current_streak_weeks")
    .eq("user_id", user.id)
    .maybeSingle<{ current_streak_weeks: number }>();
  if (streakErr) console.error("[checkins] user_streak:", streakErr.message);

  // F8 · "tu compañero entrenó" — push al resto del dúo. El helper NUNCA lanza y sin
  // VAPID keys es no-op inmediato: jamás afecta el check-in.
  const { data: miembroRow, error: miembroErr } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("trato_id, users!inner(nombre)")
    .eq("id", input.miembroId)
    .maybeSingle();
  if (miembroErr) console.error("[checkins] miembro push:", miembroErr.message);
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
  return {
    ok: true,
    data: {
      puntos: Math.round(puntos * (boostAplicado ? 1.5 : 1)),
      boostAplicado,
      deltas: deltasReales,
      nivelAntes: sheetAntes.nivel,
      nivelDespues: sheetDespues.nivel,
      xpParaSiguiente: sheetDespues.xpParaSiguiente,
      progresoNivel: sheetDespues.progresoNivel,
      tierUps,
      rachaPersonal: streakRow?.current_streak_weeks ?? 0,
      municionLista,
      sello: verificado,
      puedeAnclar,
    },
  };
}
