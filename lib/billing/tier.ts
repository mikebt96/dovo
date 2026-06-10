import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logAppError } from "@/lib/observability/log";
import { FEATURE_TIERS, meetsTier, type Feature, type Tier } from "./tiers";

/** Flag maestro de cobro. Sandbox-first: sin BILLING_ENABLED=true, billing está "preview". */
export function isBillingEnabled(): boolean {
  return process.env.BILLING_ENABLED === "true";
}

export type DuoTier = {
  tier: Tier; // tier ENTITLED del dúo (lo que realmente desbloquea)
  status: string | null; // espejo de Stripe, null si nunca suscribió
  isDemo: boolean; // dúo demo → tratado como Pro (fail-soft para el inversionista)
  billingEnabled: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  tratoId: string | null;
};

const FREE_NO_DUO: Omit<DuoTier, "billingEnabled"> = {
  tier: "free",
  status: null,
  isDemo: false,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  tratoId: null,
};

/** ¿Una sub de Stripe da acceso ahora mismo? active/trialing siempre; past_due en gracia. */
function statusEntitled(status: string | null, periodEnd: string | null): boolean {
  if (!status) return false;
  if (status === "active" || status === "trialing") return true;
  if (status === "past_due" && periodEnd) return new Date(periodEnd) > new Date();
  return false;
}

/**
 * Resuelve el tier del dúo del usuario (su primer trato, consistente con rewards.ts).
 * Reglas de resolución, en orden:
 *   1. dúo demo (is_demo) → 'pro'   (el inversionista ve la experiencia Pro)
 *   2. subscription activa/trialing/gracia → el tier de la row
 *   3. en cualquier otro caso → 'free'
 * Es el equivalente server-side de un useTier(): se invoca desde Server Components.
 */
export async function getDuoTier(): Promise<DuoTier> {
  const billingEnabled = isBillingEnabled();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...FREE_NO_DUO, billingEnabled };

  const { data: miembro, error: miembroErr } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("trato_id, tratos!inner(is_demo)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  // Fail-soft OBSERVABLE: no tiramos 500 en la home/ajustes por un read de tier, pero tampoco
  // tragamos el error en silencio (la lección del grant). Log + consola admin + degrade a free.
  if (miembroErr) {
    console.error("[getDuoTier] trato_miembros:", miembroErr.message);
    await logAppError({ origen: "tier-resolver", mensaje: `trato_miembros: ${miembroErr.message}`, userId: user.id });
  }

  const row = miembro as unknown as
    | { trato_id: string; tratos: { is_demo: boolean } | null }
    | null;
  const tratoId = row?.trato_id ?? null;
  const isDemo = !!row?.tratos?.is_demo;
  if (!tratoId) return { ...FREE_NO_DUO, billingEnabled };

  // 1 · demo → pro
  if (isDemo) {
    return {
      tier: "pro",
      status: "active",
      isDemo: true,
      billingEnabled,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      tratoId,
    };
  }

  // 2/3 · subscription real (o ausencia → free)
  const { data: sub, error: subErr } = await supabase
    .schema("core")
    .from("subscriptions")
    .select("tier, status, current_period_end, cancel_at_period_end")
    .eq("trato_id", tratoId)
    .maybeSingle<{
      tier: Tier;
      status: string;
      current_period_end: string | null;
      cancel_at_period_end: boolean;
    }>();
  // Mismo criterio: degradar a free ante error de lectura es preferible a 500ear la página,
  // pero queda logueado + en la consola admin (un dúo Pro viéndose free DEBE ser visible).
  if (subErr) {
    console.error("[getDuoTier] subscriptions:", subErr.message);
    await logAppError({ origen: "tier-resolver", mensaje: `subscriptions: ${subErr.message}`, userId: user.id });
  }

  const entitled = !!sub && statusEntitled(sub.status, sub.current_period_end);
  return {
    tier: entitled ? sub!.tier : "free",
    status: sub?.status ?? null,
    isDemo: false,
    billingEnabled,
    currentPeriodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
    tratoId,
  };
}

export type Entitlement = {
  entitled: boolean;
  required: Tier;
  current: DuoTier;
};

/** ¿El dúo tiene acceso a una feature gateada? Devuelve también el tier requerido y el estado. */
export async function getEntitlement(feature: Feature): Promise<Entitlement> {
  const current = await getDuoTier();
  const required = FEATURE_TIERS[feature];
  return { entitled: meetsTier(current.tier, required), required, current };
}
