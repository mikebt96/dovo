"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Cuenta demo para inversionistas: email + password (sin OAuth, sin SMTP).
// Pre-confirmada vía service role en el seed. Sin permisos admin, datos demo aislados.
// Override opcional con NEXT_PUBLIC_DEMO_EMAIL / DEMO_PASSWORD (server-side, no en bundle).
// Nota: un módulo "use server" solo puede exportar funciones async; estas constantes
// quedan locales (no exportadas) a propósito.
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo+ivan@dovofit.com";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "dovodemo2026";

export async function loginDemo(): Promise<{ ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (error) return { ok: false, error: error.message };
  redirect("/leaderboard");
}
