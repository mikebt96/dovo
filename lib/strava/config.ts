import { publicEnv } from "@/lib/env";

// F28 · Strava OAuth (keys-later). `stravaConfigured()` decide si la UI ofrece
// conectar (con llaves) o muestra "próximamente" (sin llaves) — mismo patrón
// que NUTRITION_AI_LIVE. Server-only: lee process.env directo (no en bundle).

export function stravaConfigured(): boolean {
  return !!process.env.STRAVA_CLIENT_ID && !!process.env.STRAVA_CLIENT_SECRET;
}

// scope: read de actividades (no escribimos en Strava). activity:read_all
// incluye actividades privadas del usuario.
export const STRAVA_SCOPE = "read,activity:read_all";

export function stravaRedirectUri(): string {
  // el callback vive en la app; usa la URL pública configurada
  return `${publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/auth/strava/callback`;
}

export function stravaAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? "",
    redirect_uri: stravaRedirectUri(),
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_SCOPE,
    state,
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
export const STRAVA_API = "https://www.strava.com/api/v3";
