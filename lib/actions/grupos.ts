"use server";

import type { Result } from "@/lib/actions/result";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToComembers } from "@/lib/push/send";
import {
  crearGrupoSchema,
  unirseGrupoSchema,
  type CrearGrupoInput,
  type UnirseGrupoInput,
} from "@/lib/schemas/grupo";

export async function crearGrupo(
  input: CrearGrupoInput,
): Promise<Result<{ id: string; invite_token: string }>> {
  const parsed = crearGrupoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "datos inválidos",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  // Insert grupo
  const { data: grupo, error: grupoErr } = await supabase
    .schema("core")
    .from("tratos")
    .insert({
      nombre_grupo: parsed.data.nombre_grupo,
      tipo_grupo: parsed.data.tipo_grupo,
      created_by: user.id,
    })
    .select("id, invite_token")
    .single();

  if (grupoErr || !grupo) {
    return { ok: false, error: grupoErr?.message ?? "error al crear grupo" };
  }

  // El creador se inserta como miembro con role 'creator'
  const { error: miembroErr } = await supabase
    .schema("core")
    .from("trato_miembros")
    .insert({
      trato_id: grupo.id as string,
      user_id: user.id,
      role: "creator",
    });

  if (miembroErr) {
    return { ok: false, error: miembroErr.message };
  }

  revalidatePath("/");
  return {
    ok: true,
    data: {
      id: grupo.id as string,
      invite_token: grupo.invite_token as string,
    },
  };
}

// Mensajes de los códigos del RPC unirse_con_token (F24). El RPC es la ÚNICA
// puerta de entrada: valida token + cupo por tipo (pareja=2, pequeño=6) en
// SECURITY DEFINER — cierra el hoyo RLS del insert directo y el bug del
// lookup por token (un extraño no puede LEER tratos bajo RLS).
const ERRORES_UNIRSE: Record<string, string> = {
  GRUPO_NO_EXISTE: "grupo no existe",
  GRUPO_INACTIVO: "este grupo ya no está activo",
  YA_MIEMBRO: "ya eres miembro de este grupo",
  GRUPO_LLENO: "este grupo ya está completo",
  AUTH_REQUERIDA: "sin sesión",
};

export async function unirseAGrupo(
  input: UnirseGrupoInput,
): Promise<Result<{ trato_id: string }>> {
  const parsed = unirseGrupoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "token inválido" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data: tratoId, error: joinErr } = await supabase
    .schema("core")
    .rpc("unirse_con_token", { p_token: parsed.data.token });

  if (joinErr) {
    return { ok: false, error: ERRORES_UNIRSE[joinErr.message] ?? joinErr.message };
  }
  const grupo = { id: tratoId as string };

  // El creador DEBE enterarse (§4.15): el push complementa al email de
  // aceptación que ya existe. Fail-soft: sin VAPID es no-op.
  const { data: me } = await supabase
    .schema("core")
    .from("users")
    .select("nombre")
    .eq("id", user.id)
    .maybeSingle<{ nombre: string }>();
  await sendPushToComembers(grupo.id as string, user.id, "reto", {
    title: "dovo · trato sellado",
    body: `${me?.nombre ?? "Tu compa"} aceptó — el trato quedó sellado. Lo prometido es deuda.`,
    url: "/",
    tag: "trato-sellado",
  });

  revalidatePath("/");
  revalidatePath(`/grupo/${grupo.id}`);
  return { ok: true, data: { trato_id: grupo.id as string } };
}
