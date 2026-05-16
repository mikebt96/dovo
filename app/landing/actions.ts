"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { getServerSupabase } from "@/lib/supabase";

/**
 * Server action de la landing.
 *
 * Recibe FormData desde <form action={joinWaitlist}>, valida con Zod
 * (single source of truth — el form también lo respeta), inserta en
 * Supabase con service_role. Retorna shape { ok, error?, alreadyIn? }
 * para que el client component muestre estado sin necesitar API route.
 *
 * Decisión: progressive enhancement. El form funciona sin JS — Next
 * hace el round-trip al server y revalida. Con JS, useActionState da
 * pending state instantáneo. El upsert idempotente (duplicate email
 * key) se trata como `alreadyIn: true` en vez de error, mejor UX para
 * el caso normal de "ya me apunté, ¿lo hice?".
 */

const Payload = z.object({
  email: z.string().trim().toLowerCase().email("Necesito un email válido."),
  duo_name: z
    .string()
    .trim()
    .max(60, "Máximo 60 caracteres.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  relationship: z
    .enum(["pareja", "amigos", "rivales", "otros"])
    .optional(),
});

export type WaitlistResult =
  | { ok: true; alreadyIn: boolean }
  | { ok: false; error: string };

export async function joinWaitlist(
  _prev: WaitlistResult | null,
  form: FormData,
): Promise<WaitlistResult> {
  const parsed = Payload.safeParse({
    email: form.get("email"),
    duo_name: form.get("duo_name") ?? undefined,
    relationship: form.get("relationship") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const h = await headers();
  const referrer = h.get("referer") ?? undefined;
  const userAgent = h.get("user-agent") ?? undefined;

  const supabase = getServerSupabase();
  const { error } = await supabase.from("waitlist").insert({
    email: parsed.data.email,
    duo_name: parsed.data.duo_name,
    relationship: parsed.data.relationship,
    referrer,
    user_agent: userAgent,
  });

  if (error) {
    // 23505 = unique_violation en Postgres → ya está en la lista.
    if (error.code === "23505") {
      return { ok: true, alreadyIn: true };
    }
    return { ok: false, error: "No se pudo guardar. Intenta otra vez." };
  }

  return { ok: true, alreadyIn: false };
}
