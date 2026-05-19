"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  diasRequeridos,
  isPastDuration,
  type Frecuencia,
} from "@/lib/utils/streak";
import { dispatchEmail } from "@/lib/email";
import { closedEmail } from "@/lib/email/templates/closed";
import { appUrl } from "@/lib/utils/url";
import { dispatchPulseEvent } from "@/lib/pulse";
import {
  categorizeGoal,
  bucketDuracion,
  bucketTasaCumplimiento,
  dowFromDate,
} from "@/lib/utils/pulse-buckets";

type TratoResultado =
  | "ambos_cumplieron"
  | "uno_fallo"
  | "ambos_fallaron"
  | "sin_resolver";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

// Lazy resolution: cierra un trato cuyo período ya pasó. Idempotente vía
// race-safe filter `.eq("estado", "activo")` — concurrent calls no double-bumpean.
// Triggea core.bump_user_score automáticamente vía DB trigger.
export async function resolveTrato(
  tratoId: string,
): Promise<Result<{ resultado: TratoResultado }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data: trato } = await supabase
    .schema("core")
    .from("tratos")
    .select(
      "id, creator_id, partner_id, frecuencia, duracion_dias, accepted_at, estado, goal, sponsored_id, created_at",
    )
    .eq("id", tratoId)
    .maybeSingle();

  if (!trato) return { ok: false, error: "trato no existe" };
  if (trato.estado !== "activo") {
    return { ok: false, error: "trato no está activo" };
  }
  if (!trato.accepted_at) {
    return { ok: false, error: "trato sin accepted_at" };
  }
  if (
    !isPastDuration(
      trato.accepted_at as string,
      trato.duracion_dias as number,
    )
  ) {
    return { ok: false, error: "trato aún en período" };
  }

  const memberIds = [trato.creator_id, trato.partner_id].filter(
    (id): id is string => typeof id === "string",
  );
  if (!memberIds.includes(user.id)) {
    return { ok: false, error: "no eres miembro" };
  }

  const { data: checkins } = await supabase
    .schema("core")
    .from("checkins")
    .select("user_id, cumplido, disputed_at")
    .eq("trato_id", tratoId);

  const rows = checkins ?? [];

  const required = diasRequeridos(
    trato.frecuencia as Frecuencia,
    trato.duracion_dias as number,
    trato.accepted_at as string,
  );

  const hayDisputas = rows.some((r) => r.disputed_at);

  const creatorCount = rows.filter(
    (r) => r.user_id === trato.creator_id && r.cumplido && !r.disputed_at,
  ).length;
  const partnerCount = rows.filter(
    (r) => r.user_id === trato.partner_id && r.cumplido && !r.disputed_at,
  ).length;

  const creator_cumplio = creatorCount >= required;
  const partner_cumplio = partnerCount >= required;

  let resultado: TratoResultado;
  if (hayDisputas) {
    resultado = "sin_resolver";
  } else if (creator_cumplio && partner_cumplio) {
    resultado = "ambos_cumplieron";
  } else if (!creator_cumplio && !partner_cumplio) {
    resultado = "ambos_fallaron";
  } else {
    resultado = "uno_fallo";
  }

  const { error: updErr } = await supabase
    .schema("core")
    .from("tratos")
    .update({
      estado: "cerrado",
      closed_at: new Date().toISOString(),
      resultado,
      creator_cumplio,
      partner_cumplio,
    })
    .eq("id", tratoId)
    .eq("estado", "activo");

  if (updErr) return { ok: false, error: updErr.message };

  // Email a ambos miembros con el resultado. Lookups separados porque cada uno
  // recibe el mismo subject pero distinto "tú cumpliste/fallaste" según su rol.
  const memberLookupIds = [trato.creator_id, trato.partner_id].filter(
    (id): id is string => typeof id === "string",
  );
  const { data: members } = await supabase
    .schema("core")
    .from("users")
    .select("id, email")
    .in("id", memberLookupIds);

  const tratoUrl = appUrl(`/trato/${tratoId}`);
  for (const m of members ?? []) {
    const email = m.email as string | undefined;
    if (!email) continue;
    const userCumplio =
      m.id === trato.creator_id ? creator_cumplio : partner_cumplio;
    dispatchEmail({
      to: email,
      ...closedEmail({
        to_email: email,
        goal: trato.goal as string,
        trato_url: tratoUrl,
        resultado,
        user_cumplio: userCumplio,
      }),
    });
  }

  // Pulse: 1 evento por trato cerrado. Fire-and-forget. La edge function
  // verifica opt-out de AMBOS miembros antes de insertar — si cualquiera
  // tiene pulse_opt_out=true, omite. Sin PII (ni user_id ni trato_id).
  const promedio = Math.round((creatorCount + partnerCount) / 2);
  dispatchPulseEvent({
    creator_id: trato.creator_id as string,
    partner_id: trato.partner_id as string,
    categoria: categorizeGoal(trato.goal as string),
    duracion_dias_bucket: bucketDuracion(trato.duracion_dias as number),
    tasa_cumplimiento_bucket: bucketTasaCumplimiento(promedio, required),
    es_patrocinado: trato.sponsored_id != null,
    dow_creacion: dowFromDate(trato.created_at as string),
  });

  revalidatePath(`/trato/${tratoId}`);
  revalidatePath("/");

  return { ok: true, data: { resultado } };
}
