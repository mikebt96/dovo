"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export type BoostTipo = "energia" | "escudo";

export type BoostActivo = {
  id: string;
  tipo: BoostTipo;
  de_user: string;
  de_nombre: string | null;
  fecha_expira: string;
};

// Regala un boost a tu partner (intra-dúo, SIEMPRE positivo). Gating (racha ≥ 2),
// cooldown (1 por emisor por dúo cada 7 días) e insert viven en core.dar_boost
// (SECURITY DEFINER, 20260610050000): los clientes no tienen INSERT sobre core.boosts.
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

  const { error } = await supabase.schema("core").rpc("dar_boost", {
    p_para_user: input.paraUserId,
    p_trato_id: input.tratoId,
    p_tipo: input.tipo,
  });
  if (error) {
    // P0001 = raise exception del RPC (mensajes en español) ⇒ tal cual al usuario.
    // Cualquier otro error (permisos, schema cache, timeout) es técnico: genérico + log.
    if (error.code === "P0001") return { ok: false, error: error.message };
    console.error("[boosts] dar:", error.code, error.message);
    return { ok: false, error: "no se pudo regalar el boost — intenta de nuevo" };
  }

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
