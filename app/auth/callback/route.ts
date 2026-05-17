import { NextResponse, type NextRequest } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Magic-link callback handler.
 *
 * Supabase manda al user a esta ruta con `?code=...&next=...`. Aquí canjeamos
 * el code por sesión (cookies se setean automáticamente via getServerClient),
 * luego redirigimos a `next` (default /match).
 *
 * Si el code está inválido o expirado, redirige a /auth/login con error.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/match";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent("Link inválido o expirado")}`,
    );
  }

  const sb = await getServerClient();
  const { error } = await sb.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const dest = next.startsWith("/") ? next : "/match";
  return NextResponse.redirect(`${origin}${dest}`);
}
