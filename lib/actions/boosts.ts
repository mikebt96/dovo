"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BOOST_GATING_RACHAS } from "@/lib/scoring/constants";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export type BoostTipo = "energia" | "escudo";

export type BoostActivo = {
  id: string;
  tipo: BoostTipo;
  de_user: string;
  de_nombre: string | null;
  fecha_expira: string;
};

// Regala un boost a tu partner (intra-dúo, SIEMPRE positivo). Gating: racha del dúo ≥ 2.
// Cooldown: 1 boost por emisor por dúo cada 7 días.
export async function darBoost(input: {
  paraUserId: string;
  tratoId: string;
  tipo: BoostTipo;
}): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };
  if (user.id === input.paraUserId) {
    return { ok: false, error: "el boost es para tu dúo, no para ti" };
  }

  // Gating: el dúo debe tener racha ≥ BOOST_GATING_RACHAS.
  const { data: streak } = await supabase
    .schema("core")
    .from("trato_streak")
    .select("current_streak_weeks")
    .eq("trato_id", input.tratoId)
    .maybeSingle<{ current_streak_weeks: number }>();
  if ((streak?.current_streak_weeks ?? 0) < BOOST_GATING_RACHAS) {
    return {
      ok: false,
      error: `desbloquea boosts con una racha de ${BOOST_GATING_RACHAS} semanas`,
    };
  }

  // Cooldown: ¿este emisor ya regaló un boost en este dúo en los últimos 7 días?
  const haceUnaSemana = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: reciente } = await supabase
    .schema("core")
    .from("boosts")
    .select("id")
    .eq("de_user", user.id)
    .eq("trato_id", input.tratoId)
    .gt("fecha_otorgado", haceUnaSemana)
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (reciente) {
    return { ok: false, error: "ya regalaste un boost esta semana" };
  }

  // energía: vence en 24h (próximo check-in). escudo: protege la semana (~7d).
  const horas = input.tipo === "energia" ? 24 : 24 * 7;
  const expira = new Date(Date.now() + horas * 3_600_000).toISOString();

  const { error } = await supabase.schema("core").from("boosts").insert({
    de_user: user.id,
    para_user: input.paraUserId,
    trato_id: input.tratoId,
    tipo: input.tipo,
    fecha_expira: expira,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath(`/grupo/${input.tratoId}`);
  return { ok: true, data: undefined };
}

// Boost vigente recibido por el usuario actual (para badge en home).
export async function getBoostActivo(): Promise<BoostActivo | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: boost } = await supabase
    .schema("core")
    .from("boosts")
    .select("id, tipo, de_user, trato_id, fecha_expira")
    .eq("para_user", user.id)
    .eq("aplicado", false)
    .gt("fecha_expira", new Date().toISOString())
    .order("fecha_otorgado", { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      tipo: BoostTipo;
      de_user: string;
      trato_id: string;
      fecha_expira: string;
    }>();
  if (!boost) return null;

  // Nombre del emisor (co-miembro → legible vía join, igual que grupo/[id]).
  const { data: giver } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("users!inner(nombre)")
    .eq("trato_id", boost.trato_id)
    .eq("user_id", boost.de_user)
    .maybeSingle<{ users: { nombre: string } | null }>();

  return {
    id: boost.id,
    tipo: boost.tipo,
    de_user: boost.de_user,
    de_nombre: giver?.users?.nombre ?? null,
    fecha_expira: boost.fecha_expira,
  };
}
