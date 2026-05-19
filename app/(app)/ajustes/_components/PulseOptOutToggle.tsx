"use client";

import { useState, useTransition } from "react";
import { updatePulseOptOut } from "@/lib/actions/profile";

export default function PulseOptOutToggle({ initial }: { initial: boolean }) {
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
          className={`relative w-12 h-6 rounded-full transition-colors ${
            optOut ? "bg-ink/30" : "bg-ink"
          } disabled:opacity-50 shrink-0 mt-1`}
          aria-pressed={!optOut}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-papel transition-transform ${
              optOut ? "translate-x-0.5" : "translate-x-[26px]"
            }`}
          />
        </button>
        <div className="flex-1">
          <p className="syne lowercase">
            {optOut ? "fuera de pulse" : "ayudando con pulse"}
          </p>
          <p className="text-xs opacity-70 mt-1 leading-relaxed">
            pulse es la capa anonimizada que mide cuánta gente cumple sus
            metas. nadie ve tus datos individuales, solo agregados. puedes
            apagarlo cuando quieras.
          </p>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
