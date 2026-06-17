import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stravaConfigured } from "@/lib/strava/config";
import { exchangeCode, guardarTokens } from "@/lib/strava/client";

export const dynamic = "force-dynamic";

// F28 · Callback OAuth de Strava. El usuario vuelve aquí con ?code&state tras
// autorizar. Verifica el state (CSRF, cookie httpOnly), intercambia el código
// por tokens (server-only), los guarda y marca la fuente conectada.
const STATE_COOKIE = "strava_oauth_state";

function volver(origin: string, estado: string) {
  return NextResponse.redirect(`${origin}/ajustes?strava=${estado}`);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // el usuario puede negar el permiso en Strava
  if (searchParams.get("error")) return volver(origin, "cancelado");
  if (!stravaConfigured()) return volver(origin, "no-config");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return volver(origin, "error");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/sign-in`);

  try {
    const tokens = await exchangeCode(code);
    await guardarTokens(user.id, tokens);
    // marca la fuente conectada (owner-readable; no hay secreto aquí)
    await supabase
      .schema("core")
      .from("fuentes_salud")
      .upsert(
        { user_id: user.id, proveedor: "strava", estado: "conectado", conectado_at: new Date().toISOString() },
        { onConflict: "user_id,proveedor" },
      );
  } catch (e) {
    console.error("[strava/callback]", e instanceof Error ? e.message : String(e));
    return volver(origin, "error");
  }

  const res = volver(origin, "ok");
  res.cookies.delete(STATE_COOKIE);
  return res;
}
