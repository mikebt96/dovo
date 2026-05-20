"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE } from "@/lib/theme";

// "system" clears the override so the OS preference applies again.
export async function setTheme(value: "light" | "dark" | "system"): Promise<void> {
  const store = await cookies();
  if (value === "system") {
    store.delete(THEME_COOKIE);
    return;
  }
  store.set(THEME_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
