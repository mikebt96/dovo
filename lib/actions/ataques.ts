"use server";

import { fechaCDMX, hoyCDMX } from "@/lib/workout/fecha";

import type { Result } from "@/lib/actions/result";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToComembers } from "@/lib/push/send";

export type AtaqueTipo = "golpe" | "congelamiento";

export type AtaqueRow = {
  id: string;
  reto_id: string;
  de_user: string;
  de_trato: string;
  para_trato: string;
  para_user: string | null;
  tipo: AtaqueTipo;
  resultado: "impacto" | "bloqueado";
  puntos: number;
  congela_hasta: string | null;
  created_at: string;
};

export type MiembroReto = { user_id: string; nombre: string; trato_id: string };

/** Contexto de ataque de UN duelo activo: munición, límite diario, rivales y feed. */
export type DuelContext = {
  municion: boolean; // entrenaste hoy (o eres demo) ⇒ tienes tu ataque del día
  yaAtacoHoy: boolean;
  rivales: MiembroReto[]; // miembros del dúo rival (picker de congelamiento)
  miembros: MiembroReto[]; // todos (para resolver nombres en el feed)
  ataques: AtaqueRow[]; // historial del duelo, más reciente primero
  congelados: { user_id: string; hasta: string }[]; // congelamientos vigentes
};

export async function getDuelContext(
  retoId: string,
  miTratoId: string,
): Promise<DuelContext> {
  const empty: DuelContext = {
    municion: false,
    yaAtacoHoy: false,
    rivales: [],
    miembros: [],
    ataques: [],
    congelados: [],
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const [{ data: miembros, error: memErr }, { data: ataques, error: atkErr }] = await Promise.all([
    supabase.schema("core").rpc("miembros_reto", { p_reto_id: retoId }),
    supabase
      .schema("core")
      .from("ataques")
      .select("id, reto_id, de_user, de_trato, para_trato, para_user, tipo, resultado, puntos, congela_hasta, created_at")
      .eq("reto_id", retoId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  if (memErr) console.error("[ataques] miembros_reto:", memErr.message);
  if (atkErr) console.error("[ataques] feed:", atkErr.message);

  const todos = (miembros ?? []) as MiembroReto[];
  const feed = (ataques ?? []) as AtaqueRow[];

  // Munición: check-in de HOY (CDMX) del usuario en su trato; dúos demo exentos (el RPC
  // lo re-valida server-side — esto es solo para pintar el botón correcto).
  const hoy = hoyCDMX();
  const [
    { data: miMiembro, error: miErr },
    { data: trato, error: tratoErr },
  ] = await Promise.all([
    supabase
      .schema("core")
      .from("trato_miembros")
      .select("id")
      .eq("trato_id", miTratoId)
      .eq("user_id", user.id)
      .maybeSingle<{ id: string }>(),
    supabase
      .schema("core")
      .from("tratos")
      .select("is_demo")
      .eq("id", miTratoId)
      .maybeSingle<{ is_demo: boolean }>(),
  ]);
  if (miErr) console.error("[ataques] mi_miembro:", miErr.message);
  if (tratoErr) console.error("[ataques] trato_demo:", tratoErr.message);
  let municion = !!trato?.is_demo;
  if (!municion && miMiembro) {
    const { data: checkinHoy, error: chkErr } = await supabase
      .schema("core")
      .from("checkins")
      .select("id")
      .eq("miembro_id", miMiembro.id)
      .eq("fecha", hoy)
      .limit(1)
      .maybeSingle<{ id: string }>();
    if (chkErr) console.error("[ataques] checkin hoy:", chkErr.message);
    municion = !!checkinHoy;
  }

  const yaAtacoHoy = feed.some(
    (a) =>
      a.de_user === user.id &&
      fechaCDMX(new Date(a.created_at)) === hoy,
  );

  // Vigentes, deduplicados por usuario (dos freezes solapados ⇒ un chip con el `hasta` mayor).
  const ahora = Date.now();
  const hastaPorUser = new Map<string, string>();
  for (const a of feed) {
    if (
      a.tipo === "congelamiento" &&
      a.resultado === "impacto" &&
      a.para_user &&
      a.congela_hasta &&
      new Date(a.congela_hasta).getTime() > ahora
    ) {
      const previo = hastaPorUser.get(a.para_user);
      if (!previo || new Date(a.congela_hasta) > new Date(previo)) {
        hastaPorUser.set(a.para_user, a.congela_hasta);
      }
    }
  }
  const congelados = [...hastaPorUser].map(([user_id, hasta]) => ({ user_id, hasta }));

  return {
    municion,
    yaAtacoHoy,
    rivales: todos.filter((m) => m.trato_id !== miTratoId),
    miembros: todos,
    ataques: feed,
    congelados,
  };
}

/** Lanza un ataque al dúo rival. TODA la validación vive en el RPC (atómico). */
export async function lanzarAtaque(input: {
  retoId: string;
  tipo: AtaqueTipo;
  paraUser?: string;
}): Promise<Result<AtaqueRow>> {
  // Códigos estables (F25·G22): AttackPanel los traduce vía KNOWN_ERROR_CODES
  // (retos.err.*); los P0001 del RPC son pass-through deliberado (abajo).
  if (input.tipo !== "golpe" && input.tipo !== "congelamiento") {
    return { ok: false, error: "ataque_tipo_invalido" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data, error } = await supabase.schema("core").rpc("lanzar_ataque", {
    p_reto_id: input.retoId,
    p_tipo: input.tipo,
    p_para_user: input.paraUser ?? null,
  });
  if (error) {
    // P0001 = raise exception del RPC (mensajes en español juguetón) ⇒ tal cual al usuario.
    // Cualquier otro error (permisos, schema cache, timeout) es técnico: genérico + log.
    if (error.code === "P0001") return { ok: false, error: error.message };
    console.error("[ataques] lanzar:", error.code, error.message);
    return { ok: false, error: "ataque_no_enviado" };
  }
  const ataque = data as unknown as AtaqueRow;

  // Push al dúo rival (pref 'reto'). Fire-safe: jamás rompe el ataque.
  // es-only deliberado (BRAND.md §español MX-first); por-locale requiere
  // persistir idioma del receptor (schema).
  const titulo =
    ataque.resultado === "bloqueado"
      ? "🛡️ ¡escudo activado!"
      : ataque.tipo === "golpe"
        ? "🥊 ¡les llegó un golpe!"
        : "❄️ ¡congelamiento!";
  const cuerpo =
    ataque.resultado === "bloqueado"
      ? "su escudo bloqueó un ataque rival — y se consumió."
      : ataque.tipo === "golpe"
        ? "el dúo rival les restó 10 puntos del duelo. contraataquen entrenando."
        : "uno de ustedes está congelado 12h para el marcador del duelo.";
  await sendPushToComembers(ataque.para_trato, user.id, "reto", {
    title: "dovo",
    body: `${titulo} ${cuerpo}`,
    url: "/retos",
    tag: `ataque-${ataque.id}`,
  });

  revalidatePath("/retos");
  return { ok: true, data: ataque };
}

// El ataque recibido DUELE en la home (directiva §5 home-1): el último impacto
// de las últimas 24h contra MI dúo, para el banner del lobby. "Visto" vive en
// localStorage del cliente (sin tabla — directiva §4.4) — aquí solo datos.
export async function getAtaqueRecienteRecibido(
  tratoId: string,
): Promise<{ id: string; tipo: AtaqueTipo; created_at: string } | null> {
  const supabase = await createClient();
  const hace24h = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data, error } = await supabase
    .schema("core")
    .from("ataques")
    .select("id, tipo, created_at")
    .eq("para_trato", tratoId)
    .eq("resultado", "impacto")
    .neq("de_trato", tratoId)
    .gt("created_at", hace24h)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; tipo: AtaqueTipo; created_at: string }>();
  if (error) {
    console.error("[ataques] reciente:", error.message);
    return null;
  }
  return data ?? null;
}
