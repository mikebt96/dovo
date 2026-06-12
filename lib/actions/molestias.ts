"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyCDMX } from "@/lib/workout/fecha";
import { ZONAS, type Zona } from "@/lib/workout/recuperacion";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

// Pre-entreno: "¿alguna molestia hoy?" — historial honesto por fecha CDMX.
// El plan del día marca "cuídate hoy" lo que cargue la zona; jamás regaña.

export async function getMolestiasHoy(): Promise<Zona[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .schema("core")
    .from("molestias")
    .select("zona")
    .eq("user_id", user.id)
    .eq("fecha", hoyCDMX());
  if (error) {
    console.error("[molestias] hoy:", error.message);
    return [];
  }
  return ((data ?? []) as { zona: Zona }[]).map((r) => r.zona);
}

// Toggle de zona para HOY: marcar la molestia o quitarla si ya estaba.
export async function toggleMolestia(zona: string): Promise<Result<{ activa: boolean }>> {
  if (!(ZONAS as readonly string[]).includes(zona)) {
    return { ok: false, error: "zona inválida" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const fecha = hoyCDMX();
  const { data: existente } = await supabase
    .schema("core")
    .from("molestias")
    .select("id")
    .eq("user_id", user.id)
    .eq("fecha", fecha)
    .eq("zona", zona)
    .maybeSingle<{ id: string }>();

  if (existente) {
    const { error } = await supabase
      .schema("core")
      .from("molestias")
      .delete()
      .eq("id", existente.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/", "layout");
    return { ok: true, data: { activa: false } };
  }

  const { error } = await supabase
    .schema("core")
    .from("molestias")
    .insert({ user_id: user.id, fecha, zona });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, data: { activa: true } };
}

// "Llego bien": limpia las molestias de hoy.
export async function limpiarMolestiasHoy(): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { error } = await supabase
    .schema("core")
    .from("molestias")
    .delete()
    .eq("user_id", user.id)
    .eq("fecha", hoyCDMX());
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
