import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";

/**
 * Cookies:
 *   dovo_slug    — set tras /unlock con slug correcto. Sin expiración.
 *   dovo_pin_ok  — set tras /unlock con PIN correcto. Expira en 30 min.
 *
 * Ambos son flags ("ok") — el valor real del slug/PIN nunca vuelve al cliente.
 */
export const SLUG_COOKIE = "dovo_slug";
export const PIN_COOKIE = "dovo_pin_ok";
export const PIN_TTL_SECONDS = 30 * 60; // 30 min

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
