"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { darBoost, type BoostTipo } from "@/lib/actions/boosts";

// Regala un boost a tu partner. Intra-dúo, SIEMPRE positivo (lenguaje cálido, no rojo).
// state lo calcula el server: "gate" (racha insuficiente) | "cooldown" | "ok".
export default function BoostButton({
  tratoId,
  paraUserId,
  paraNombre,
  state,
  gateRacha,
}: {
  tratoId: string;
  paraUserId: string;
  paraNombre: string;
  state: "ok" | "gate" | "cooldown";
  gateRacha: number;
}) {
  const t = useTranslations("boosts");
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return <p className="text-xs mono uppercase tracking-widest text-signal">{t("sent")}</p>;
  }
  if (state === "gate") {
    return (
      <p className="text-xs mono uppercase tracking-wider opacity-50">
        {t("gateHint", { n: gateRacha })}
      </p>
    );
  }
  if (state === "cooldown") {
    return (
      <p className="text-xs mono uppercase tracking-wider opacity-50">{t("cooldown")}</p>
    );
  }

  function give(tipo: BoostTipo) {
    setMsg(null);
    start(async () => {
      const r = await darBoost({ paraUserId, tratoId, tipo });
      if (r.ok) setDone(true);
      else setMsg(r.error);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs mono uppercase tracking-widest text-signal hover:opacity-80 transition-opacity"
      >
        ✦ {t("giveTo", { nombre: paraNombre })}
      </button>
    );
  }

  return (
    <div className="w-full">
      <p className="text-[11px] mono uppercase tracking-widest opacity-60 mb-2">
        {t("choose")}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => give("energia")}
          className="flex-1 border border-ink/15 rounded-lg p-3 text-left hover:border-signal transition-colors disabled:opacity-50"
        >
          <span className="display font-semibold lowercase block">{t("energia")}</span>
          <span className="text-[11px] opacity-60">{t("hintEnergia")}</span>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => give("escudo")}
          className="flex-1 border border-ink/15 rounded-lg p-3 text-left hover:border-signal transition-colors disabled:opacity-50"
        >
          <span className="display font-semibold lowercase block">{t("escudo")}</span>
          <span className="text-[11px] opacity-60">{t("hintEscudo")}</span>
        </button>
      </div>
      {pending && <p className="text-xs opacity-60 mt-2">{t("sending")}</p>}
      {msg && <p className="text-xs text-red-600 mt-2">{msg}</p>}
    </div>
  );
}
