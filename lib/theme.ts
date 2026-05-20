import { cookies } from "next/headers";

// Theme override cookie. Absence ⇒ follow the OS (prefers-color-scheme).
export const THEME_COOKIE = "dovo-theme";
export type ThemeOverride = "light" | "dark";

export async function getThemeOverride(): Promise<ThemeOverride | null> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === "light" || v === "dark" ? v : null;
}
