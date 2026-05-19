"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  visibilitySchema,
  optOutSchema,
  type VisibilityInput,
  type OptOutInput,
} from "@/lib/schemas/profile";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export async function updateScoreVisibility(
  input: VisibilityInput,
): Promise<Result> {
  const parsed = visibilitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "valor de visibilidad inválido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { error } = await supabase
    .schema("core")
    .from("user_scores")
    .upsert(
      {
        user_id: user.id,
        visibility: parsed.data.visibility,
      },
      { onConflict: "user_id" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/perfil");
  return { ok: true, data: undefined };
}

export async function updatePulseOptOut(input: OptOutInput): Promise<Result> {
  const parsed = optOutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "valor inválido" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { error } = await supabase
    .schema("core")
    .from("users")
    .update({ pulse_opt_out: parsed.data.opt_out })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/ajustes");
  return { ok: true, data: undefined };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
