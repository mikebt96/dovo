"use server";

import "server-only";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import { requireSlug } from "@/lib/auth/session";

/**
 * Tienda — reclamar + consumir recompensas.
 *
 * Modelo two-stage:
 *   1. claimReward → descuenta coins + inserta rewards_unlocked
 *      (estado: claimed pero NO redeemed → es un "voucher" en tu wallet).
 *   2. markRewardRedeemed → cambia redeemed=true cuando ya lo usaste IRL.
 *
 * Por qué dos pasos: para regalos físicos (tenis, suplementos) hay un gap
 * entre "lo gané" y "ya llegó/lo usé". El gap está bien — la UI muestra
 * "tienes 3 vouchers pendientes" como recordatorio.
 *
 * Atomicity caveat: en v1 hacemos read-then-write del balance de coins
 * SIN transacción. Si dos requests concurrentes pegan el mismo voucher al
 * mismo tiempo, técnicamente uno podría leer balance stale y permitir un
 * doble cobro. En la práctica para 2 usuarios es near-zero risk; cuando
 * vaya a SaaS, migrar a una RPC con `select … for update` en Postgres.
 */

const ClaimInput = z.object({
  reward_id: z.number().int().positive(),
  profile: z.enum(["mike", "andy"]),
});

const MarkInput = z.object({
  claim_id: z.number().int().positive(),
  profile: z.enum(["mike", "andy"]),
});

export type ClaimResult =
  | { ok: true; claimId: number; newBalance: number }
  | { ok: false; error: string };

export type MarkResult = { ok: true } | { ok: false; error: string };

/**
 * Reclama un premio. Valida coins + descuenta + inserta voucher.
 * Para `requires_both=true` valida que AMBOS tengan el balance suficiente
 * (el coin del partner NO se cobra — sólo el del claimer — por simplicidad
 * v1; el partner "aporta" al hacer su parte de la disciplina).
 */
export async function claimReward(
  input: z.infer<typeof ClaimInput>,
): Promise<ClaimResult> {
  await requireSlug();

  const parsed = ClaimInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Input inválido" };
  const { reward_id, profile } = parsed.data;

  const myUuid = await slugToUuid(profile);
  if (!myUuid) return { ok: false, error: "Perfil no encontrado" };

  const sb = getServerSupabase();

  // 1. Leer reward (cost + requires_both)
  const { data: reward, error: rErr } = await sb
    .from("rewards_catalog")
    .select("id, cost_coins, requires_both, active")
    .eq("id", reward_id)
    .single();
  if (rErr || !reward)
    return { ok: false, error: "Premio no existe" };
  if (!reward.active) return { ok: false, error: "Premio inactivo" };

  const cost = reward.cost_coins as number;
  const requiresBoth = !!reward.requires_both;

  // 2. Validar balance(s)
  const partnerSlug = profile === "mike" ? "andy" : "mike";
  const partnerUuid = await slugToUuid(partnerSlug);

  const [myCoinsRes, partnerCoinsRes] = await Promise.all([
    sb.from("coins").select("balance").eq("profile_id", myUuid).single(),
    requiresBoth && partnerUuid
      ? sb.from("coins").select("balance").eq("profile_id", partnerUuid).single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const myBalance = (myCoinsRes.data?.balance as number | undefined) ?? 0;
  if (myBalance < cost) {
    return { ok: false, error: `Faltan ${cost - myBalance} coins` };
  }
  if (requiresBoth) {
    const partnerBalance =
      (partnerCoinsRes.data?.balance as number | undefined) ?? 0;
    if (partnerBalance < cost) {
      return {
        ok: false,
        error: `Premio del dúo — al partner le faltan ${cost - partnerBalance} coins`,
      };
    }
  }

  // 3. Descontar coins (sólo del claimer en v1)
  const newBalance = myBalance - cost;
  const { error: updErr } = await sb
    .from("coins")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("profile_id", myUuid);
  if (updErr) return { ok: false, error: updErr.message };

  // 4. Crear voucher (rewards_unlocked, redeemed=false)
  const { data: claim, error: insErr } = await sb
    .from("rewards_unlocked")
    .insert({
      reward_id,
      unlocked_by: myUuid,
      unlocked_for_slug: requiresBoth ? "both" : profile,
      redeemed: false,
    })
    .select("id")
    .single();

  if (insErr) {
    // Rollback best-effort de los coins (no es atómico, pero mejor que nada)
    await sb
      .from("coins")
      .update({ balance: myBalance, updated_at: new Date().toISOString() })
      .eq("profile_id", myUuid);
    return { ok: false, error: insErr.message };
  }

  return { ok: true, claimId: claim.id as number, newBalance };
}

/**
 * Marca un voucher como consumido (`redeemed=true`). No mueve coins —
 * eso ya pasó en claimReward. Sólo registra el momento de uso.
 *
 * Idempotente: si ya está redeemed, no-op.
 */
export async function markRewardRedeemed(
  input: z.infer<typeof MarkInput>,
): Promise<MarkResult> {
  await requireSlug();

  const parsed = MarkInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Input inválido" };
  const { claim_id, profile } = parsed.data;

  const myUuid = await slugToUuid(profile);
  if (!myUuid) return { ok: false, error: "Perfil no encontrado" };

  const sb = getServerSupabase();
  const { error } = await sb
    .from("rewards_unlocked")
    .update({ redeemed: true, redeemed_at: new Date().toISOString() })
    .eq("id", claim_id)
    .eq("unlocked_by", myUuid)
    .eq("redeemed", false); // sólo si aún no estaba redimido
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
