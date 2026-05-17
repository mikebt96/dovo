"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";

const Input = z.object({
  email: z.string().email("Correo inválido"),
  next: z.string().default("/match"),
});

type Result =
  | { ok: true }
  | { ok: false; error: string };

export async function sendMagicLink(formData: FormData): Promise<Result> {
  const parsed = Input.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? "/match",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input inválido" };
  }

  const { email, next } = parsed.data;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const sb = await getServerClient();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${base}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return { ok: false, error: error.message };

  // Mostrar pantalla "checa tu correo"
  redirect(`/auth/login?next=${encodeURIComponent(next)}&sent=1`);
}

export async function signOut(): Promise<void> {
  const sb = await getServerClient();
  await sb.auth.signOut();
  redirect("/");
}
