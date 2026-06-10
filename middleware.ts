import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = [
  "/",
  "/sign-up",
  "/sign-in",
  "/auth/callback",
  "/privacidad",
  "/terminos",
  "/showcase",
  "/landing",
];

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname)
    || pathname.startsWith("/_next")
    || pathname.startsWith("/invite/")
    // Las rutas API se autentican solas (el webhook de Stripe verifica FIRMA, no sesión).
    // Sin esto el middleware redirige el POST de Stripe a /sign-in y la entrega falla.
    || pathname.startsWith("/api/")
    // El service worker DEBE ser público: el browser lo registra sin sesión y un
    // redirect a /sign-in rompe el registro del push (F8).
    || pathname === "/sw.js"
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
    "/((?!_next/static|_next/image|favicon.ico|icon\\.svg|manifest\\.webmanifest|apple-icon|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|mov)$).*)",
  ],
};
