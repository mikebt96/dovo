"use server";

import type { Result } from "@/lib/actions/result";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { stravaConfigured, stravaAuthUrl } from "@/lib/strava/config";

// F28 · Conectar/desconectar Strava (keys-later). El estado de conexión vive
// en core.fuentes_salud (owner-readable); los tokens en core.strava_tokens
// (service-role-only). Sin llaves, configured=false ⇒ la UI muestra "próximamente".

const STATE_COOKIE = "strava_oauth_state";

export type StravaEstado = {
  configured: boolean;
  estado: "conectado" | "desconectado" | null;
};

export async function getStravaEstado(): Promise<StravaEstado> {
  const configured = stravaConfigured();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { configured, estado: null };

  const { data, error } = await supabase
    .schema("core")
    .from("fuentes_salud")
    .select("estado")
    .eq("user_id", user.id)
    .eq("proveedor", "strava")
    .maybeSingle<{ estado: "conectado" | "desconectado" }>();
  if (error) console.error("[strava] estado:", error.message);
  return { configured, estado: data?.estado ?? null };
}

// Genera la URL de OAuth + fija un state CSRF en cookie httpOnly. El cliente
// redirige a la URL devuelta. Devuelve null si Strava no está configurado.
export async function iniciarStravaConnect(): Promise<Result<{ url: string }>> {
  if (!stravaConfigured()) return { ok: false, error: "strava no está configurado todavía" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  // state CSRF: aleatorio, atado a este navegador vía cookie httpOnly
  const state = crypto.randomUUID();
  const jar = await cookies();
  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return { ok: true, data: { url: stravaAuthUrl(state) } };
}

export async function desconectarStrava(): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  // los tokens se borran con service role (tabla cerrada al cliente)
  const svc = createServiceClient();
  const { error: tErr } = await svc
    .schema("core")
    .from("strava_tokens")
    .delete()
    .eq("user_id", user.id);
  if (tErr) return { ok: false, error: tErr.message };

  const { error: fErr } = await supabase
    .schema("core")
    .from("fuentes_salud")
    .update({ estado: "desconectado" })
    .eq("user_id", user.id)
    .eq("proveedor", "strava");
  if (fErr) return { ok: false, error: fErr.message };

  revalidatePath("/ajustes");
  return { ok: true, data: undefined };
}
