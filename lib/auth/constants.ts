/**
 * Cookie names y TTL — extraídos a un módulo separado para que el middleware
 * (edge runtime) los pueda importar sin arrastrar `node:crypto` (que session.ts
 * usa para timingSafeEqual y NO está disponible en edge).
 */
export const SLUG_COOKIE = "dovo_slug";
export const PIN_COOKIE = "dovo_pin_ok";
export const PIN_TTL_SECONDS = 30 * 60; // 30 min
