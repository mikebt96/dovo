"use server";

import type { Result } from "@/lib/actions/result";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { optOutSchema, type OptOutInput } from "@/lib/schemas/profile";

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
