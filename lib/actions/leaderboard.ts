"use server";

import type { Result } from "@/lib/actions/result";

import { createClient } from "@/lib/supabase/server";
import { periodoRange, type Periodo } from "@/lib/utils/periodo";

export type LeaderRow = {
  posicion: number;
  trato_id: string;
  nombre_grupo: string;
  n_miembros: number;
  total_puntos: number;
  puntos_por_miembro: number;
  racha_duo: number;
  top_clase: string | null;
  top_stat: string | null;
};

// Leaderboard de dúos por puntos normalizados (puntos_base) del periodo.
// SECURITY DEFINER en DB → devuelve el ranking completo (es la superficie competitiva),
// solo agregados + nombre de grupo (sin PII).
export async function getLeaderboard(
  periodo: Periodo = "semana",
  soloParejas = true,
): Promise<Result<LeaderRow[]>> {
  const { start, end } = periodoRange(periodo);
  const supabase = await createClient();
  const { data, error } = await supabase.schema("core").rpc("leaderboard_duos", {
    p_period_start: start,
    p_period_end: end,
    p_limit: 50,
    p_solo_parejas: soloParejas,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as LeaderRow[] };
}

export type DemoRow = {
  posicion: number;
  nombre_grupo: string;
  n_miembros: number;
  total_puntos: number;
  puntos_por_miembro: number;
  racha_duo: number;
  top_clase: string | null;
  top_stat: string | null;
};

// Leaderboard PÚBLICO para el showcase (RPC anon, solo dúos is_demo, cero PII).
// Llamable sin sesión (rol anon).
export async function getShowcase(limit = 8): Promise<DemoRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .schema("core")
    .rpc("leaderboard_demo", { p_limit: limit });
  return (data ?? []) as DemoRow[];
}

// IDs de los tratos del usuario actual (para resaltar "tu dúo" en la tabla).
export async function misTratoIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("trato_id")
    .eq("user_id", user.id);
  return ((data ?? []) as { trato_id: string }[]).map((r) => r.trato_id);
}
