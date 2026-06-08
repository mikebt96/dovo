import "server-only";
import Stripe from "stripe";
import type { Tier } from "@/lib/billing/tiers";

// Cliente Stripe con init PEREZOSO: sin STRIPE_SECRET_KEY devuelve null y nada truena
// (sandbox-first). Se construye una sola vez cuando la key existe.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) {
    _stripe = new Stripe(key, {
      appInfo: { name: "dovo", url: "https://dovofit.com" },
    });
  }
  return _stripe;
}

// Price IDs por (tier, interval). VACÍOS en sandbox → priceIdFor devuelve null →
// createCheckout devuelve coming_soon (la pricing page se ve completa, el botón dice "próximamente").
// Miguel los pega en Vercel env al crear los productos en Stripe.
const PRICE_IDS: Record<Exclude<Tier, "free">, { month?: string; year?: string }> = {
  pro: {
    month: process.env.STRIPE_PRICE_PRO_MONTHLY,
    year: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  premium: {
    month: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    year: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
  },
};

export type BillingInterval = "month" | "year";

export function priceIdFor(tier: Tier, interval: BillingInterval): string | null {
  if (tier === "free") return null;
  return PRICE_IDS[tier][interval] ?? null;
}

// Mapeo inverso price → tier (el webhook deriva el tier del price comprado).
export function tierForPriceId(priceId: string | null | undefined): Tier {
  if (!priceId) return "free";
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY || priceId === process.env.STRIPE_PRICE_PRO_YEARLY) {
    return "pro";
  }
  if (priceId === process.env.STRIPE_PRICE_PREMIUM_MONTHLY || priceId === process.env.STRIPE_PRICE_PREMIUM_YEARLY) {
    return "premium";
  }
  // Conservador DE VERDAD: un price desconocido (typo en env, price viejo, cambio en Stripe)
  // NO debe otorgar acceso pagado → 'free'. Como el Checkout exige un price configurado
  // (priceIdFor), un webhook nunca llega aquí con un price legítimo; un 'free' aquí + status
  // 'active' es un estado anómalo y detectable, mejor que regalar Pro.
  return "free";
}
