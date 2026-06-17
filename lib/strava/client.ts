import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { STRAVA_TOKEN_URL, STRAVA_API } from "./config";

// F28 · Cliente Strava server-only. Maneja el intercambio de código, el
// refresh de tokens y el fetch de actividades. Los tokens viven en
// core.strava_tokens (service-role-only); NUNCA tocan el cliente.

type StravaTokenResp = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch segundos
  athlete?: { id: number };
  scope?: string;
};

export async function exchangeCode(code: string): Promise<StravaTokenResp> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`strava token exchange ${res.status}`);
  return (await res.json()) as StravaTokenResp;
}

export async function guardarTokens(userId: string, t: StravaTokenResp): Promise<void> {
  const svc = createServiceClient();
  await svc.schema("core").from("strava_tokens").upsert(
    {
      user_id: userId,
      athlete_id: t.athlete?.id ?? null,
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: new Date(t.expires_at * 1000).toISOString(),
      scope: t.scope ?? null,
    },
    { onConflict: "user_id" },
  );
}

// Devuelve un access_token válido, refrescándolo si expiró (margen de 60s).
export async function accessTokenVigente(userId: string): Promise<string | null> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .schema("core")
    .from("strava_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .maybeSingle<{ access_token: string; refresh_token: string; expires_at: string }>();
  if (error || !data) return null;

  if (new Date(data.expires_at).getTime() - Date.now() > 60_000) {
    return data.access_token;
  }

  // refresh
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error("[strava] refresh falló:", res.status);
    return null;
  }
  const t = (await res.json()) as StravaTokenResp;
  await guardarTokens(userId, t);
  return t.access_token;
}

export type StravaActividad = {
  id: number;
  name: string;
  type: string; // Run, Ride, ...
  distance: number; // metros
  moving_time: number; // segundos
  average_heartrate?: number;
  start_date: string; // ISO
};

// Actividades recientes del atleta (para mapear a core.actividad_metricas).
export async function actividadesRecientes(
  userId: string,
  desde: Date,
): Promise<StravaActividad[] | null> {
  const token = await accessTokenVigente(userId);
  if (!token) return null;
  const after = Math.floor(desde.getTime() / 1000);
  const res = await fetch(`${STRAVA_API}/athlete/activities?after=${after}&per_page=30`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error("[strava] actividades:", res.status);
    return null;
  }
  return (await res.json()) as StravaActividad[];
}
