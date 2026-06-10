"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { RETO_DURACION_DIAS } from "@/lib/scoring/constants";
import { sendPushToComembers } from "@/lib/push/send";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export type RetoEstado = "propuesto" | "aceptado" | "activo" | "cerrado" | "rechazado";

export type RetoRow = {
  id: string;
  trato_a: string;
  trato_b: string;
  periodo_inicio: string;
  periodo_fin: string;
  estado: RetoEstado;
  creado_por: string;
  ganador_trato_id: string | null;
  created_at: string;
};

export type Marcador = {
  reto_id: string;
  estado: RetoEstado;
  periodo_inicio: string;
  periodo_fin: string;
  trato_a: string;
  nombre_a: string;
  puntos_a: number;
  trato_b: string;
  nombre_b: string;
  puntos_b: number;
  lider_trato_id: string | null;
};

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Reta a otro dúo: crea un duelo de RETO_DURACION_DIAS días por puntos normalizados.
export async function crearReto(input: {
  miTratoId: string;
  rivalTratoId: string;
}): Promise<Result<{ retoId: string }>> {
  if (input.miTratoId === input.rivalTratoId) {
    return { ok: false, error: "no puedes retarte a ti mismo" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const inicio = hoyISO();
  const fin = new Date(Date.now() + RETO_DURACION_DIAS * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .schema("core")
    .from("retos")
    .insert({
      trato_a: input.miTratoId,
      trato_b: input.rivalTratoId,
      periodo_inicio: inicio,
      periodo_fin: fin,
      estado: "propuesto",
      creado_por: user.id,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "ya hay un reto vivo entre estos dúos" };
    }
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "no se pudo crear el reto" };

  // F8 · "los retaron a duelo" — push a los miembros del dúo rival (el actor no es
  // miembro del rival, así que reciben ambos). Fail-soft: no-op sin VAPID.
  const { data: miTrato } = await supabase
    .schema("core")
    .from("tratos")
    .select("nombre_grupo")
    .eq("id", input.miTratoId)
    .maybeSingle<{ nombre_grupo: string }>();
  await sendPushToComembers(input.rivalTratoId, user.id, "reto", {
    title: "dovo · reto",
    body: `${miTrato?.nombre_grupo ?? "un dúo"} los retó a duelo. ¿Aceptan?`,
    url: "/retos",
    tag: "reto-nuevo",
  });

  revalidatePath("/retos");
  return { ok: true, data: { retoId: data.id } };
}

// El dúo retado acepta (→ activo) o rechaza.
export async function responderReto(
  retoId: string,
  accion: "aceptar" | "rechazar",
): Promise<Result> {
  const supabase = await createClient();
  // Al aceptar, el contador de 7 días arranca AHORA (no desde la propuesta), para que
  // ambos dúos compitan la ventana completa.
  const update =
    accion === "aceptar"
      ? {
          estado: "activo" as const,
          periodo_inicio: hoyISO(),
          periodo_fin: new Date(Date.now() + RETO_DURACION_DIAS * 86_400_000)
            .toISOString()
            .slice(0, 10),
        }
      : { estado: "rechazado" as const };
  const { error } = await supabase
    .schema("core")
    .from("retos")
    .update(update)
    .eq("id", retoId);
  if (error) return { ok: false, error: error.message };

  // F8 · al ACEPTAR, avisa al dúo retador (trato_a) que el duelo está vivo.
  if (accion === "aceptar") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: reto } = await supabase
      .schema("core")
      .from("retos")
      .select("trato_a")
      .eq("id", retoId)
      .maybeSingle<{ trato_a: string }>();
    if (user && reto?.trato_a) {
      await sendPushToComembers(reto.trato_a, user.id, "reto", {
        title: "dovo · reto",
        body: "Aceptaron su reto — el duelo ya corre. A entrenar.",
        url: "/retos",
        tag: "reto-aceptado",
      });
    }
  }

  revalidatePath("/retos");
  return { ok: true, data: undefined };
}

// Marcador en vivo del duelo (definer → incluye nombre del rival, no legible por RLS).
export async function getMarcador(retoId: string): Promise<Result<Marcador>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("core")
    .rpc("marcador_reto", { p_reto_id: retoId })
    .maybeSingle<Marcador>();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "reto no encontrado" };
  return { ok: true, data };
}

// Cierra el duelo y fija ganador por puntos_base (idempotente en DB).
export async function cerrarRetoAction(retoId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("core")
    .rpc("cerrar_reto", { p_reto_id: retoId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/retos");
  return { ok: true, data: undefined };
}

// Retos del dúo (RLS: el usuario es party). Filas crudas; la UI pide marcador por reto.
export async function getRetosDeTrato(tratoId: string): Promise<RetoRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .schema("core")
    .from("retos")
    .select(
      "id, trato_a, trato_b, periodo_inicio, periodo_fin, estado, creado_por, ganador_trato_id, created_at",
    )
    .or(`trato_a.eq.${tratoId},trato_b.eq.${tratoId}`)
    .order("created_at", { ascending: false });
  return (data ?? []) as RetoRow[];
}
