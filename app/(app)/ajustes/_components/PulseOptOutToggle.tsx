"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updatePulseOptOut } from "@/lib/actions/profile";

export default function PulseOptOutToggle({ initial }: { initial: boolean }) {
  const t = useTranslations("ajustes");
  const [optOut, setOptOut] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !optOut;
    setOptOut(next);
    setError(null);
    start(async () => {
      const res = await updatePulseOptOut({ opt_out: next });
      if (!res.ok) {
        setOptOut(!next);
        setError(res.error);
      }
    });
  }

  return (
    <div>
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            optOut ? "bg-ink/25" : "bg-signal"
          } disabled:opacity-50 shrink-0 mt-1`}
          aria-pressed={!optOut}
        >
          {/* Mínimo 44×44px de área táctil (WCAG 2.1 SC 2.5.5): padding extendido via wrapper */}
          <span
            className={`absolute top-1 w-6 h-6 rounded-full bg-papel transition-transform ${
              optOut ? "translate-x-1" : "translate-x-[32px]"
            }`}
          />
        </button>
        <div className="flex-1">
          <p className="display font-semibold lowercase">
            {optOut ? t("pulseOff") : t("pulseOn")}
          </p>
          <p className="text-xs opacity-70 mt-1 leading-relaxed">{t("pulseDesc")}</p>
        </div>
      </div>
      {error && <p className="text-xs text-rival-deep mt-2">{error}</p>}
    </div>
  );
}
