import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, tierForPriceId } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

// El SDK de Stripe usa crypto de Node → runtime nodejs (no edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ServiceClient = ReturnType<typeof createServiceClient>;

/**
 * Webhook de Stripe → actualiza core.subscriptions (estado de la sub POR DÚO).
 * Best-practice (skill stripe-integration-expert):
 *   · verifica la FIRMA (constructEventAsync) — rechaza payloads no firmados.
 *   · IDEMPOTENTE — cada event.id se procesa una vez (Stripe reintenta en 500).
 *   · RE-FETCH desde Stripe — no confía solo en el payload para el estado crítico.
 *   · escribe con service_role (bypass RLS; el webhook no es un user autenticado).
 * Sandbox-first: sin STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET responde 200 sin procesar
 * (no rompe; se activa solo al pegar las keys + BILLING_ENABLED en Vercel).
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ received: true, billing: "disabled" });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const svc = createServiceClient();

  // Idempotencia: si ya lo procesamos, no repetir. Si la LECTURA falla no podemos garantizar
  // idempotencia → 500 para que Stripe reintente (mejor que procesar a ciegas y duplicar).
  const { data: seen, error: seenErr } = await svc
    .schema("core")
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle<{ id: string }>();
  if (seenErr) {
    console.error("[stripe-webhook] idempotency read:", seenErr.message);
    return NextResponse.json({ error: "idempotency check failed" }, { status: 500 });
  }
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertSub(svc, sub, session.customer as string, session.metadata?.trato_id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSub(svc, sub, sub.customer as string);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { error: delErr } = await svc
          .schema("core")
          .from("subscriptions")
          .update({
            tier: "free",
            status: "canceled",
            stripe_subscription_id: null,
            cancel_at_period_end: false,
          })
          .eq("stripe_subscription_id", sub.id);
        if (delErr) throw new Error(`subscription.deleted update: ${delErr.message}`);
        break;
      }
      default:
        break;
    }

    // Marca procesado SOLO si no hubo throw (un 500 hace que Stripe reintente). El upsert por
    // trato_id es idempotente, así que reintentar tras un fallo aquí es seguro.
    const { error: markErr } = await svc
      .schema("core")
      .from("stripe_events")
      .insert({ id: event.id, type: event.type });
    if (markErr) throw new Error(`mark processed ${event.id}: ${markErr.message}`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[stripe-webhook] error en ${event.type}:`, err);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}

// Mapea una Stripe.Subscription → row de core.subscriptions (upsert por trato_id).
async function upsertSub(
  svc: ServiceClient,
  sub: Stripe.Subscription,
  customerId: string,
  tratoIdHint?: string | null,
) {
  const tratoId =
    tratoIdHint ??
    sub.metadata?.trato_id ??
    (await tratoIdByCustomer(svc, customerId));
  if (!tratoId) throw new Error(`sin trato_id para la sub ${sub.id}`);

  const item = sub.items.data[0];
  const priceId = item?.price?.id ?? null;
  const interval = item?.price?.recurring?.interval ?? null; // 'month' | 'year'

  // current_period_end migró a nivel de item en API recientes → leemos de ambos lados.
  const periodEndUnix =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (item as unknown as { current_period_end?: number } | undefined)?.current_period_end ??
    null;
  const currentPeriodEnd = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null;

  const { error } = await svc.schema("core").from("subscriptions").upsert(
    {
      trato_id: tratoId,
      tier: tierForPriceId(priceId),
      status: sub.status,
      interval,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: sub.cancel_at_period_end,
    },
    { onConflict: "trato_id" },
  );
  // Throw → el catch del POST devuelve 500 → Stripe reintenta (no dejamos el tier desincronizado).
  if (error) throw new Error(`upsertSub ${sub.id}: ${error.message}`);
}

async function tratoIdByCustomer(
  svc: ServiceClient,
  customerId: string,
): Promise<string | null> {
  const { data, error } = await svc
    .schema("core")
    .from("subscriptions")
    .select("trato_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle<{ trato_id: string }>();
  // Un error de lectura aquí NO es "no hay trato" → throw para no enmascararlo con 500 confuso.
  if (error) throw new Error(`tratoIdByCustomer ${customerId}: ${error.message}`);
  return data?.trato_id ?? null;
}
