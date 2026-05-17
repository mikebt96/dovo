import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware v0.1 — solo gatea rutas nuevas del MVP commitment device.
 *
 * El matcher es EXPLÍCITO en las rutas que requieren sesión Supabase. No
 * intentamos atrapar todo: las rutas legacy de mikeAndy v1 (/mike, /andy,
 * /juntos, /unlock) viven con su gate slug+PIN propio hasta que el archive
 * happens y se borran del repo.
 *
 * Brand assets (icon.svg, apple-icon, opengraph-image, manifest.webmanifest)
 * NO están en el matcher → pasan libre, servidos por Next directo. Esta
 * decisión es lo que arregla el bug del 2026-05-16 donde el middleware
 * viejo redirigía favicon y OG a /unlock.
 */

const PROTECTED_PREFIXES = ["/match", "/dashboard", "/perfil", "/trato"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresca la sesión (Supabase rota tokens cada hora; sin este call los
  // cookies se quedan stale y el user es "logueado pero invisible").
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected(request.nextUrl.pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/match",
    "/match/:path*",
    "/dashboard/:path*",
    "/perfil/:path*",
    "/trato/:path*",
  ],
};
