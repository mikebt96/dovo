"use server";

import type { Result } from "@/lib/actions/result";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Reward = {
  id: string;
  icono: string;
  titulo: string;
  descripcion: string;
  racha_threshold: number;
  unlocked: boolean;
  faltan: number; // semanas de racha que faltan (0 si ya desbloqueado)
};

export type PartnerDiscount = {
  id: string;
  partner: string;
  icono: string;
  titulo: string;
  codigo: string;
  racha_threshold: number;
  unlocked: boolean;
  faltan: number;
};

export type RewardsData = {
  racha: number;
  tratoId: string | null;
  rewards: Reward[];
  partners: PartnerDiscount[];
};

export type WishlistItem = { id: string; titulo: string; url: string | null };
export type WishlistGroup = {
  userId: string;
  nombre: string;
  isMe: boolean;
  items: WishlistItem[];
};

async function miPrimerTrato(): Promise<{ userId: string; tratoId: string | null } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: miembro } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("trato_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle<{ trato_id: string }>();
  return { userId: user.id, tratoId: miembro?.trato_id ?? null };
}

// Catálogo de recompensas/partners con estado de desbloqueo DERIVADO de la racha del
// dúo (determinista: racha >= threshold). Sin tabla de estado: el unlock se recalcula.
export async function getRewardsData(): Promise<RewardsData> {
  const supabase = await createClient();
  const ctx = await miPrimerTrato();
  const tratoId = ctx?.tratoId ?? null;

  let racha = 0;
  if (tratoId) {
    const { data: streak } = await supabase
      .schema("core")
      .from("trato_streak")
      .select("current_streak_weeks")
      .eq("trato_id", tratoId)
      .maybeSingle<{ current_streak_weeks: number }>();
    racha = streak?.current_streak_weeks ?? 0;
  }

  const [{ data: rewardRows }, { data: partnerRows }] = await Promise.all([
    supabase
      .schema("core")
      .from("rewards")
      .select("id, icono, titulo, descripcion, racha_threshold, orden")
      .eq("activo", true)
      .order("orden"),
    supabase
      .schema("core")
      .from("partner_discounts")
      .select("id, partner, icono, titulo, codigo, racha_threshold, orden")
      .eq("activo", true)
      .order("orden"),
  ]);

  const rewards: Reward[] = (rewardRows ?? []).map((r) => ({
    id: r.id,
    icono: r.icono,
    titulo: r.titulo,
    descripcion: r.descripcion,
    racha_threshold: r.racha_threshold,
    unlocked: racha >= r.racha_threshold,
    faltan: Math.max(0, r.racha_threshold - racha),
  }));

  const partners: PartnerDiscount[] = (partnerRows ?? []).map((p) => ({
    id: p.id,
    partner: p.partner,
    icono: p.icono,
    titulo: p.titulo,
    codigo: p.codigo,
    racha_threshold: p.racha_threshold,
    unlocked: racha >= p.racha_threshold,
    faltan: Math.max(0, p.racha_threshold - racha),
  }));

  return { racha, tratoId, rewards, partners };
}

// Wishlist del dúo: items míos + los del co-miembro, lado a lado (refuerza el "dúo").
// RLS permite leer los propios y los de quien comparte trato conmigo (shares_trato).
export async function getWishlist(tratoId: string | null): Promise<WishlistGroup[]> {
  if (!tratoId) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: miembrosRaw } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("user_id, users!inner(nombre)")
    .eq("trato_id", tratoId);

  const miembros = (miembrosRaw as unknown as Array<{
    user_id: string;
    users: { nombre: string } | null;
  }> | null) ?? [];
  if (miembros.length === 0) return [];

  const ids = miembros.map((m) => m.user_id);
  const { data: itemsRaw } = await supabase
    .schema("core")
    .from("wishlist")
    .select("id, user_id, titulo, url")
    .in("user_id", ids)
    .order("created_at", { ascending: true });

  const items = (itemsRaw ?? []) as Array<{
    id: string;
    user_id: string;
    titulo: string;
    url: string | null;
  }>;

  // El usuario actual primero (su columna a la izquierda).
  const ordered = [...miembros].sort((a, b) =>
    a.user_id === user.id ? -1 : b.user_id === user.id ? 1 : 0,
  );

  return ordered.map((m) => ({
    userId: m.user_id,
    nombre: m.users?.nombre ?? "miembro",
    isMe: m.user_id === user.id,
    items: items
      .filter((i) => i.user_id === m.user_id)
      .map((i) => ({ id: i.id, titulo: i.titulo, url: i.url })),
  }));
}

export async function addWishlistItem(input: {
  titulo: string;
  url?: string;
}): Promise<Result<{ id: string }>> {
  const titulo = input.titulo.trim();
  if (!titulo) return { ok: false, error: "escribe algo que quieras" };
  if (titulo.length > 80) return { ok: false, error: "máximo 80 caracteres" };
  const url = input.url?.trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data, error } = await supabase
    .schema("core")
    .from("wishlist")
    .insert({ user_id: user.id, titulo, url })
    .select("id")
    .maybeSingle<{ id: string }>();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "no se pudo agregar" };
  revalidatePath("/recompensas");
  return { ok: true, data: { id: data.id } };
}

export async function removeWishlistItem(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("core")
    .from("wishlist")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/recompensas");
  return { ok: true, data: undefined };
}
