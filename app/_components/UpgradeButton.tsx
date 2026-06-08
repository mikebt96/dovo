"use client";

import { useState, useTransition } from "react";
import { createCheckout } from "@/lib/actions/billing";
import type { Tier } from "@/lib/billing/tiers";
import type { BillingInterval } from "@/lib/stripe";

// CTA de upgrade. Sandbox-first: con billing OFF NO llama a Stripe — al hacer clic
// revela "próximamente · te avisamos" (jamás un checkout roto). Con billing ON crea el
// Checkout y redirige. El sentinel 'coming_soon' del action también cae al estado soft.
export default function UpgradeButton({
  tier,
  interval,
  billingEnabled,
  label,
  comingSoonLabel,
  errorLabel,
  className = "",
}: {
  tier: Tier;
  interval: BillingInterval;
  billingEnabled: boolean;
  label: string;
  comingSoonLabel: string;
  errorLabel: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [soon, setSoon] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    setErr(null);
    if (!billingEnabled) {
      setSoon(true);
      return;
    }
    startTransition(async () => {
      const res = await createCheckout({ tier, interval });
      if (res.ok) {
        window.location.href = res.data.url;
      } else if (res.error === "coming_soon") {
        setSoon(true);
      } else {
        setErr(res.error || errorLabel);
      }
    });
  }

  if (soon) {
    return (
      <span
        className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm mono uppercase tracking-[0.14em] border border-signal/40 bg-signal/[0.06] text-signal ${className}`}
      >
        🔔 {comingSoonLabel}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={`inline-flex items-center justify-center rounded-full px-6 py-3 display font-semibold lowercase transition-colors disabled:opacity-60 ${className}`}
      >
        {pending ? "…" : label}
      </button>
      {err && (
        <span className="text-[11px] mono uppercase tracking-wider text-red-600/80 text-center">
          {err}
        </span>
      )}
    </span>
  );
}
