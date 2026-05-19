import { publicEnv } from "@/lib/env";

// Construye URLs absolutas del app normalizando el trailing slash de
// NEXT_PUBLIC_APP_URL (algunos providers como Vercel guardan la URL con
// "/" al final). Sin esto, concat manual `${APP_URL}/path` produce "//path".
export function appUrl(path: string): string {
  const base = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
