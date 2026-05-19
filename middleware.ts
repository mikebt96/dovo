import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = [
  "/",
  "/sign-up",
  "/sign-in",
  "/auth/callback",
];

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname)
    || pathname.startsWith("/_next")
    || pathname.startsWith("/invite/")
  );
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Rutas protegidas requieren user autenticado
  if (!isPublic(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Si user autenticado entra a auth pages, redirigir a home
  if (user && (pathname === "/sign-up" || pathname === "/sign-in")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon\\.svg|manifest\\.webmanifest|apple-icon|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
