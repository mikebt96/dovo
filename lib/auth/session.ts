import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";
import {
  SLUG_COOKIE,
  PIN_COOKIE,
  PIN_TTL_SECONDS,
} from "./constants";

// Re-export para no romper call-sites existentes que importaban desde session.
export { SLUG_COOKIE, PIN_COOKIE, PIN_TTL_SECONDS };

function timingSafe(a: string, b: string): boolean {
  // Mismo length para timingSafeEqual; pad para evitar leak por longitud.
  const max = Math.max(a.length, b.length, 1);
  const A = Buffer.alloc(max, 0);
  const B = Buffer.alloc(max, 0);
  A.write(a);
  B.write(b);
  return timingSafeEqual(A, B) && a.length === b.length;
}

export function verifySlug(value: string): boolean {
  const expected = getEnv().SECRET_LINK_SLUG;
  return timingSafe(value, expected);
}

export function verifyPin(value: string): boolean {
  const expected = getEnv().APP_PIN;
  if (!expected) return false; // PIN no configurado → siempre rechaza
  return timingSafe(value, expected);
}

/**
 * Lanza redirect a /unlock si la cookie de slug no es válida.
 * Llamar al inicio de cualquier Server Action que mute DB.
 */
export async function requireSlug(): Promise<void> {
  const jar = await cookies();
  const value = jar.get(SLUG_COOKIE)?.value;
  if (!value || value !== "ok") {
    redirect("/unlock");
  }
}

/**
 * Lanza redirect si no hay sesión PIN activa.
 * Para rutas y actions sobre datos sensibles: body_photos, weight_log.
 */
export async function requirePinSession(): Promise<void> {
  const jar = await cookies();
  const value = jar.get(PIN_COOKIE)?.value;
  if (!value || value !== "ok") {
    redirect("/unlock?reason=pin");
  }
}
