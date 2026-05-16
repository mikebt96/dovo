import { NextResponse, type NextRequest } from "next/server";

import { PIN_COOKIE, SLUG_COOKIE } from "@/lib/auth/constants";

/**
 * Gate global:
 *   - Si la cookie de slug no está en "ok", redirect a /unlock.
 *   - Si la URL es sensible (/foto, /peso, /api/sensitive/*), además exige
 *     cookie PIN. La validez REAL del PIN se chequea en el Server Action
 *     que setea la cookie; aquí solo confiamos en el marker.
 *
 * Excluye /unlock, /_next, archivos estáticos.
 */
const SENSITIVE_PATTERNS = [/\/foto(\/|$)/, /\/peso(\/|$)/, /^\/api\/sensitive\//];

function isSensitive(pathname: string): boolean {
  return SENSITIVE_PATTERNS.some((re) => re.test(pathname));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Gate de slug
  const slugOk = req.cookies.get(SLUG_COOKIE)?.value === "ok";
  if (!slugOk) {
    const url = req.nextUrl.clone();
    url.pathname = "/unlock";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Gate de PIN sobre rutas sensibles
  if (isSensitive(pathname)) {
    const pinOk = req.cookies.get(PIN_COOKIE)?.value === "ok";
    if (!pinOk) {
      const url = req.nextUrl.clone();
      url.pathname = "/unlock";
      url.searchParams.set("reason", "pin");
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Aplica a todo excepto: assets de Next, archivos públicos, /unlock, favicon.
    "/((?!_next/static|_next/image|favicon.ico|unlock|landing|api/webhook).*)",
  ],
};
