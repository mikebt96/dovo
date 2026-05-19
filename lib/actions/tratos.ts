"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTratoSchema, acceptTratoSchema } from "@/lib/schemas/trato";

type Result<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createTrato(
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const duracionRaw = formData.get("duracion_dias");
  const parsed = createTratoSchema.safeParse({
    goal: formData.get("goal"),
    frecuencia: formData.get("frecuencia"),
    duracion_dias: typeof duracionRaw === "string" ? Number(duracionRaw) : 0,
    recompensa_text: formData.get("recompensa_text"),
    castigo_text: formData.get("castigo_text"),
    partner_email: formData.get("partner_email"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "datos inválidos",
    };
  }

  // No invitarse a uno mismo
  const { data: meRow } = await supabase
    .schema("core")
    .from("users")
    .select("email")
    .eq("id", user.id)
    .single();
  if (
    meRow?.email?.toLowerCase() === parsed.data.partner_email.toLowerCase()
  ) {
    return { ok: false, error: "no puedes invitarte a ti mismo" };
  }

  // Si el partner_email ya existe en core.users, link directo via partner_id
  const { data: partnerRow } = await supabase
    .schema("core")
    .from("users")
    .select("id")
    .eq("email", parsed.data.partner_email)
    .maybeSingle();

  const { data: row, error } = await supabase
    .schema("core")
    .from("tratos")
    .insert({
      creator_id: user.id,
      partner_id: (partnerRow?.id as string | undefined) ?? null,
      partner_email: parsed.data.partner_email,
      goal: parsed.data.goal,
      frecuencia: parsed.data.frecuencia,
      duracion_dias: parsed.data.duracion_dias,
      recompensa_text: parsed.data.recompensa_text,
      castigo_text: parsed.data.castigo_text,
    })
    .select("id")
    .single();

  if (error || !row) {
    return { ok: false, error: error?.message ?? "error al crear trato" };
  }

  revalidatePath("/");
  return { ok: true, data: { id: row.id as string } };
}

export async function acceptTrato(
  token: string,
): Promise<Result<{ trato_id: string }>> {
  const parsed = acceptTratoSchema.safeParse({ token });
  if (!parsed.success) return { ok: false, error: "token inválido" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data: trato, error: lookupErr } = await supabase
    .schema("core")
    .from("tratos")
    .select(
      "id, creator_id, partner_id, partner_email, invite_expires_at, estado",
    )
    .eq("invite_token", parsed.data.token)
    .maybeSingle();

  if (lookupErr || !trato) return { ok: false, error: "invite no existe" };
  if (trato.estado !== "pendiente_aceptacion") {
    return { ok: false, error: "trato ya no está pendiente" };
  }
  if (new Date(trato.invite_expires_at as string) < new Date()) {
    return { ok: false, error: "invite expirado" };
  }
  if (trato.creator_id === user.id) {
    return { ok: false, error: "no puedes aceptar tu propio trato" };
  }

  const { data: meRow } = await supabase
    .schema("core")
    .from("users")
    .select("email")
    .eq("id", user.id)
    .single();
  if (
    meRow?.email?.toLowerCase() !==
    (trato.partner_email as string).toLowerCase()
  ) {
    return { ok: false, error: "este invite no es para tu correo" };
  }

  const { error: updErr } = await supabase
    .schema("core")
    .from("tratos")
    .update({
      partner_id: user.id,
      estado: "activo",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", trato.id as string);

  if (updErr) return { ok: false, error: updErr.message };

  revalidatePath("/");
  revalidatePath(`/trato/${trato.id}`);
  return { ok: true, data: { trato_id: trato.id as string } };
}
