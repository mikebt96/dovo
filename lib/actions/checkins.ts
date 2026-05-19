"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createCheckinSchema,
  disputeCheckinSchema,
  type CreateCheckinInput,
  type DisputeCheckinInput,
} from "@/lib/schemas/checkin";
import { todayMx, isPastDuration } from "@/lib/utils/streak";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export async function createCheckin(
  input: CreateCheckinInput,
): Promise<Result<{ id: string }>> {
  const parsed = createCheckinSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "datos inválidos",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data: trato, error: lookupErr } = await supabase
    .schema("core")
    .from("tratos")
    .select("id, creator_id, partner_id, accepted_at, duracion_dias, estado")
    .eq("id", parsed.data.trato_id)
    .maybeSingle();

  if (lookupErr || !trato) return { ok: false, error: "trato no existe" };
  if (trato.estado !== "activo") {
    return { ok: false, error: "trato no está activo" };
  }
  const memberIds = [trato.creator_id, trato.partner_id].filter(
    (id): id is string => typeof id === "string",
  );
  if (!memberIds.includes(user.id)) {
    return { ok: false, error: "no eres miembro del trato" };
  }
  if (
    !trato.accepted_at ||
    isPastDuration(
      trato.accepted_at as string,
      trato.duracion_dias as number,
    )
  ) {
    return { ok: false, error: "el trato ya cerró su período" };
  }

  const today = todayMx();

  // Upsert permite editar el check-in del día (cumplido/nota) hasta el cierre del día
  const { data: row, error } = await supabase
    .schema("core")
    .from("checkins")
    .upsert(
      {
        trato_id: parsed.data.trato_id,
        user_id: user.id,
        fecha: today,
        cumplido: parsed.data.cumplido,
        nota: parsed.data.nota ?? null,
      },
      { onConflict: "trato_id,user_id,fecha" },
    )
    .select("id")
    .single();

  if (error || !row) {
    return {
      ok: false,
      error: error?.message ?? "error al guardar check-in",
    };
  }

  revalidatePath(`/trato/${parsed.data.trato_id}`);
  return { ok: true, data: { id: row.id as string } };
}

export async function disputeCheckin(
  input: DisputeCheckinInput,
): Promise<Result> {
  const parsed = disputeCheckinSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "datos inválidos",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data: checkin, error: lookupErr } = await supabase
    .schema("core")
    .from("checkins")
    .select(
      "id, trato_id, user_id, disputed_at, tratos!checkins_trato_id_fkey(creator_id, partner_id)",
    )
    .eq("id", parsed.data.checkin_id)
    .maybeSingle();

  if (lookupErr || !checkin) return { ok: false, error: "check-in no existe" };
  if (checkin.user_id === user.id) {
    return { ok: false, error: "no puedes disputar tu propio check-in" };
  }

  const trato = checkin.tratos as unknown as {
    creator_id: string;
    partner_id: string | null;
  } | null;
  if (!trato) return { ok: false, error: "trato no encontrado" };

  const memberIds = [trato.creator_id, trato.partner_id].filter(
    (id): id is string => typeof id === "string",
  );
  if (!memberIds.includes(user.id)) {
    return { ok: false, error: "no eres miembro del trato" };
  }

  if (checkin.disputed_at) {
    return { ok: false, error: "este check-in ya está disputado" };
  }

  const { error: updErr } = await supabase
    .schema("core")
    .from("checkins")
    .update({
      disputed_by: user.id,
      disputed_reason: parsed.data.reason,
      disputed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.checkin_id);

  if (updErr) return { ok: false, error: updErr.message };

  revalidatePath(`/trato/${checkin.trato_id}`);
  return { ok: true, data: undefined };
}
