"use client";

import { vibrateTap } from "@/lib/juice";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { marcarApuestaSaldada } from "@/lib/actions/apuestas";

// "Ya pagó": solo el que NO perdió absuelve (regla del consejo — la absolución
// es del acreedor). Confirmación en dos taps, capa S al saldar.
export default function ApuestaSaldarButton({ apuestaId }: { apuestaId: string }) {
  const t = useTranslations("apuesta");
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  function saldar() {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    start(async () => {
      const r = await marcarApuestaSaldada(apuestaId);
      if (r.ok) {
        vibrateTap();
        router.refresh();
      } else {
        setConfirm(false);
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={saldar}
      className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] mono uppercase tracking-[0.14em] border transition-colors disabled:opacity-50 ${
        confirm
          ? "bg-signal text-white border-signal"
          : "border-signal/40 text-signal-deep hover:border-signal"
      }`}
    >
      {confirm ? t("saldarConfirm") : t("saldarCta")}
    </button>
  );
}
