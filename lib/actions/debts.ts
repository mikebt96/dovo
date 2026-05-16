"use server";

import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase";
import { requireSlug } from "@/lib/auth/session";

/**
 * Server Actions sobre pair_debts.
 * Política: NO atamos al profile actor. La sesión slug ya autenticó al dúo;
 * cualquiera puede marcar paid/forgiven o cambiar penalty. Es vista compartida.
 */

const IdInput = z.object({ id: z.number().int().positive() });
const ChangePenaltyInput = z.object({
  id: z.number().int().positive(),
  penalty_id: z.number().int().positive().nullable(),
});

type Result = { ok: true } | { ok: false; error: string };

async function updateDebt(
  id: number,
  patch: Record<string, unknown>,
): Promise<Result> {
  const sb = getServerSupabase();
  const { error } = await sb.from("pair_debts").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mike/duo");
  revalidatePath("/andy/duo");
  return { ok: true };
}

export async function markDebtPaid(input: z.infer<typeof IdInput>): Promise<Result> {
  await requireSlug();
  const parsed = IdInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Input inválido" };
  return updateDebt(parsed.data.id, {
    status: "paid",
    resolved_at: new Date().toISOString(),
  });
}

export async function markDebtForgiven(input: z.infer<typeof IdInput>): Promise<Result> {
  await requireSlug();
  const parsed = IdInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Input inválido" };
  return updateDebt(parsed.data.id, {
    status: "forgiven",
    resolved_at: new Date().toISOString(),
  });
}

export async function changeDebtPenalty(
  input: z.infer<typeof ChangePenaltyInput>,
): Promise<Result> {
  await requireSlug();
  const parsed = ChangePenaltyInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Input inválido" };
  return updateDebt(parsed.data.id, { penalty_id: parsed.data.penalty_id });
}
