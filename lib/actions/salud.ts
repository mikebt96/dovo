"use server";

import type { Result } from "@/lib/actions/result";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AVISO_VERSION } from "@/lib/legal/aviso-version";

// ── Re-consentimiento del aviso de privacidad (aviso §19: "conservamos el
// registro de la versión que cada usuario aceptó"). El registro guarda el
// consentimiento tácito de los usuarios NUEVOS; los ANTERIORES a la v1.0
// (cambio material: nueva finalidad de monetización) reaceptan vía banner. ──

/** ¿al usuario le falta aceptar la versión VIGENTE del aviso? (para el banner) */
export async function necesitaAceptarAviso(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .schema("core")
    .from("consentimientos")
    .select("id")
    .eq("user_id", user.id)
    .eq("tipo", "aviso_privacidad")
    .eq("version_aviso", AVISO_VERSION)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[salud] necesitaAceptarAviso:", error.message);
    return false; // ante la duda no acosamos con el banner; el log queda
  }
  return !data;
}

/** registra la aceptación del aviso vigente (banner de re-consentimiento) */
export async function aceptarAvisoPrivacidad(): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  // idempotente: si ya aceptó esta versión, no duplicar la bitácora
  if (!(await necesitaAceptarAviso())) return { ok: true, data: undefined };

  const { error } = await supabase.schema("core").from("consentimientos").insert({
    user_id: user.id,
    tipo: "aviso_privacidad",
    otorgado: true,
    version_aviso: AVISO_VERSION,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true, data: undefined };
}

// F25 · Salud y permisos. Los datos de salud son SENSIBLES: el consentimiento
// es expreso (toggle dedicado, jamás pre-palomeado), queda en bitácora
// append-only con la versión del aviso, y los datos viven owner-only — ni el
// compa los ve, jamás entran a Pulse ni a inteligencia de premios, jamás se
// venden (ley MX + políticas de HealthKit/Health Connect).

export type TipoConsentimiento = "salud" | "ubicacion";
export type ProveedorSalud = "apple_health" | "health_connect";
export type EstadoFuente = "interesado" | "conectado" | "desconectado";

export type EstadoSalud = {
  salud: boolean;
  ubicacion: boolean;
  fuentes: Partial<Record<ProveedorSalud, EstadoFuente>>;
};

export async function getEstadoSalud(): Promise<EstadoSalud | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: cons, error: cErr }, { data: fuentes, error: fErr }] = await Promise.all([
    supabase
      .schema("core")
      .from("consentimientos")
      .select("tipo, otorgado, created_at")
      .eq("user_id", user.id)
      .in("tipo", ["salud", "ubicacion"])
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .schema("core")
      .from("fuentes_salud")
      .select("proveedor, estado")
      .eq("user_id", user.id),
  ]);
  if (cErr) {
    console.error("[salud] consentimientos:", cErr.message);
    return null;
  }
  if (fErr) {
    console.error("[salud] fuentes:", fErr.message);
    return null;
  }

  // Bitácora append-only: la fila más reciente por tipo manda.
  const ultimo: Partial<Record<TipoConsentimiento, boolean>> = {};
  for (const c of (cons ?? []) as Array<{ tipo: TipoConsentimiento; otorgado: boolean }>) {
    if (!(c.tipo in ultimo)) ultimo[c.tipo] = c.otorgado;
  }

  const mapa: EstadoSalud["fuentes"] = {};
  for (const f of (fuentes ?? []) as Array<{ proveedor: ProveedorSalud; estado: EstadoFuente }>) {
    mapa[f.proveedor] = f.estado;
  }

  return {
    salud: ultimo.salud ?? false,
    ubicacion: ultimo.ubicacion ?? false,
    fuentes: mapa,
  };
}

export async function setConsentimiento(
  tipo: TipoConsentimiento,
  otorgado: boolean,
): Promise<Result> {
  if (tipo !== "salud" && tipo !== "ubicacion") {
    return { ok: false, error: "tipo inválido" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { error } = await supabase.schema("core").from("consentimientos").insert({
    user_id: user.id,
    tipo,
    otorgado,
    version_aviso: AVISO_VERSION,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/ajustes");
  return { ok: true, data: undefined };
}

export async function marcarFuenteInteres(proveedor: ProveedorSalud): Promise<Result> {
  if (proveedor !== "apple_health" && proveedor !== "health_connect") {
    return { ok: false, error: "proveedor inválido" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { error } = await supabase
    .schema("core")
    .from("fuentes_salud")
    .upsert(
      { user_id: user.id, proveedor, estado: "interesado" },
      { onConflict: "user_id,proveedor" },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/ajustes");
  return { ok: true, data: undefined };
}
