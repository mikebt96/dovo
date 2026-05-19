"use client";

import { useState, useTransition } from "react";
import { updateScoreVisibility } from "@/lib/actions/profile";

type Visibility = "hidden" | "duos_con_trato" | "publico";

const OPTIONS: { value: Visibility; label: string; desc: string }[] = [
  {
    value: "hidden",
    label: "oculto",
    desc: "solo tú lo ves",
  },
  {
    value: "duos_con_trato",
    label: "tus dúos",
    desc: "lo ven los que han hecho trato contigo",
  },
  {
    value: "publico",
    label: "público",
    desc: "lo ve quien sea",
  },
];

export default function VisibilityToggle({
  current,
}: {
  current: Visibility;
}) {
  const [value, setValue] = useState<Visibility>(current);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function pick(v: Visibility) {
    if (v === value) return;
    const previous = value;
    setValue(v);
    setError(null);
    start(async () => {
      const res = await updateScoreVisibility({ visibility: v });
      if (!res.ok) {
        setValue(previous);
        setError(res.error);
      }
    });
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-widest opacity-60 mb-3">
        quién ve tu score
      </p>
      <div className="space-y-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={pending}
            onClick={() => pick(opt.value)}
            className={`w-full text-left p-4 border transition-colors ${
              value === opt.value
                ? "border-ink bg-ink text-papel"
                : "border-ink/20 hover:border-ink/50"
            } disabled:opacity-50`}
          >
            <p className="syne lowercase">{opt.label}</p>
            <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
