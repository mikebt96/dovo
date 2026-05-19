"use server";

import { createClient } from "@/lib/supabase/server";
import { signUpSchema, signInSchema } from "@/lib/schemas/auth";
import { appUrl } from "@/lib/utils/url";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    nombre: formData.get("nombre"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: appUrl("/auth/callback"),
      data: { nombre: parsed.data.nombre, intent: "sign_up" },
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "email inválido" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: appUrl("/auth/callback"),
      data: { intent: "sign_in" },
      shouldCreateUser: false,
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
