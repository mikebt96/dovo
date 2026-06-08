"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { openBillingPortal } from "@/lib/actions/billing";

// Abre el Customer Portal de Stripe. Sandbox-first: con billing OFF revela "próximamente".
export default function ManageButton({ billingEnabled }: { billingEnabled: boolean }) {
  const t = useTranslations("suscripcion");
  const [pending, startTransition] = useTransition();
  const [soon, setSoon] = useState(false);

  function onClick() {
    if (!billingEnabled) {
      setSoon(true);
      return;
    }
    startTransition(async () => {
      const res = await openBillingPortal();
      if (res.ok) window.location.href = res.data.url;
      else setSoon(true);
    });
  }

  if (soon) {
    return (
      <span className="text-[11px] mono uppercase tracking-[0.14em] text-signal">
        🔔 {t("comingSoon")}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-[11px] mono uppercase tracking-[0.14em] underline decoration-signal/40 underline-offset-4 opacity-80 hover:opacity-100 disabled:opacity-50"
    >
      {pending ? "…" : t("manage")}
    </button>
  );
}
