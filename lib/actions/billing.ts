"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe, priceIdFor, type BillingInterval } from "@/lib/stripe";
import { isBillingEnabled } from "@/lib/billing/tier";
import { publicEnv } from "@/lib/env";
import type { Tier } from "@/lib/billing/tiers";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

// Sentinel: el cliente distingue "coming_soon" (sandbox) de un error real para mostrar
// el modal "próximamente" en vez de un toast de error.
const COMING_SOON = "coming_soon";

async function primerTratoId(): Promise<{ userId: string; email: string | null; tratoId: string | null } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: miembro } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("trato_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle<{ trato_id: string }>();
  return { userId: user.id, email: user.email ?? null, tratoId: miembro?.trato_id ?? null };
}

/**
 * Crea un Checkout de suscripción de Stripe POR DÚO. La sub es del trato: cualquiera
 * de los dos paga y desbloquea a ambos. Sandbox-first: sin keys/price-id devuelve
 * { ok:false, error:'coming_soon' } y el cliente muestra "próximamente" (nunca un checkout roto).
 */
export async function createCheckout(input: {
  tier: Tier;
  interval: BillingInterval;
}): Promise<Result<{ url: string }>> {
  if (!isBillingEnabled()) return { ok: false, error: COMING_SOON };
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: COMING_SOON };
  const priceId = priceIdFor(input.tier, input.interval);
  if (!priceId) return { ok: false, error: COMING_SOON };

  const ctx = await primerTratoId();
  if (!ctx) return { ok: false, error: "sin sesión" };
  if (!ctx.tratoId) return { ok: false, error: "necesitas un dúo primero" };

  // Reutiliza el customer del dúo si ya existe (guardado vía service role, bypass RLS).
  const svc = createServiceClient();
  const { data: existing } = await svc
    .schema("core")
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("trato_id", ctx.tratoId)
    .maybeSingle<{ stripe_customer_id: string | null }>();

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.email ?? undefined,
      metadata: { trato_id: ctx.tratoId, created_by: ctx.userId },
    });
    customerId = customer.id;
    // Pre-crea la row (tier free / incomplete) para anclar el customer al dúo.
    await svc
      .schema("core")
      .from("subscriptions")
      .upsert(
        { trato_id: ctx.tratoId, stripe_customer_id: customerId, tier: "free", status: "incomplete" },
        { onConflict: "trato_id" },
      );
  }

  const appUrl = publicEnv.NEXT_PUBLIC_APP_URL;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    locale: "es",
    subscription_data: { metadata: { trato_id: ctx.tratoId } },
    metadata: { trato_id: ctx.tratoId, tier: input.tier, interval: input.interval },
    success_url: `${appUrl}/suscripcion?success=1`,
    cancel_url: `${appUrl}/suscripcion?canceled=1`,
  });

  if (!session.url) return { ok: false, error: "no se pudo crear el checkout" };
  return { ok: true, data: { url: session.url } };
}

/**
 * Abre el Customer Portal de Stripe (gestionar/cancelar). Sandbox-first: sin keys → coming_soon.
 */
export async function openBillingPortal(): Promise<Result<{ url: string }>> {
  if (!isBillingEnabled()) return { ok: false, error: COMING_SOON };
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: COMING_SOON };

  const ctx = await primerTratoId();
  if (!ctx) return { ok: false, error: "sin sesión" };
  if (!ctx.tratoId) return { ok: false, error: "sin dúo" };

  const svc = createServiceClient();
  const { data: sub } = await svc
    .schema("core")
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("trato_id", ctx.tratoId)
    .maybeSingle<{ stripe_customer_id: string | null }>();
  if (!sub?.stripe_customer_id) return { ok: false, error: "sin suscripción" };

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${publicEnv.NEXT_PUBLIC_APP_URL}/suscripcion`,
  });
  return { ok: true, data: { url: portal.url } };
}
