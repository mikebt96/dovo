"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { darBoost, type BoostTipo } from "@/lib/actions/boosts";
import GameIcon from "./GameIcon";

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
    return (
      <p
        className="anim-pop inline-flex items-center gap-1.5 text-xs mono uppercase tracking-widest rounded-full px-3 py-1.5 text-coop-deep"
        style={{ background: "color-mix(in srgb, var(--mode-coop) 14%, transparent)" }}
      >
        <GameIcon name="chispa" size={13} filled />
        {t("sent")}
      </p>
    );
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
        className="inline-flex items-center gap-1.5 text-xs mono uppercase tracking-widest rounded-full px-3 py-1.5 border text-coop-deep hover:border-coop transition-colors"
        style={{ borderColor: "color-mix(in srgb, var(--mode-coop) 40%, transparent)" }}
      >
        <GameIcon name="chispa" size={13} />
        {t("giveTo", { nombre: paraNombre })}
      </button>
    );
  }

  return (
    <div className="w-full">
      <p className="text-[11px] mono uppercase tracking-widest opacity-60 mb-2">
        {t("choose")}
      </p>
      <div className="flex gap-2">
        {/* ritual coop (§4.13): teal, iconos del juego — los emojis se retiran */}
        <button
          type="button"
          disabled={pending}
          onClick={() => give("energia")}
          className="flex-1 border rounded-xl p-3 text-left transition-colors disabled:opacity-50 hover:border-coop"
          style={{ borderColor: "color-mix(in srgb, var(--mode-coop) 30%, transparent)" }}
        >
          <span className="flex items-center gap-1.5 display font-semibold lowercase">
            <span className="text-coop-deep"><GameIcon name="rayo" size={14} filled /></span>
            {t("energia")}
          </span>
          <span className="block text-[11px] opacity-60 mt-0.5">{t("hintEnergia")}</span>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => give("escudo")}
          className="flex-1 border rounded-xl p-3 text-left transition-colors disabled:opacity-50 hover:border-coop"
          style={{ borderColor: "color-mix(in srgb, var(--mode-coop) 30%, transparent)" }}
        >
          <span className="flex items-center gap-1.5 display font-semibold lowercase">
            <span className="text-coop-deep"><GameIcon name="escudo" size={14} filled /></span>
            {t("escudo")}
          </span>
          <span className="block text-[11px] opacity-60 mt-0.5">{t("hintEscudo")}</span>
        </button>
      </div>
      {pending && <p className="text-xs opacity-60 mt-2">{t("sending")}</p>}
      {msg && <p className="text-xs text-red-600 mt-2">{msg}</p>}
    </div>
  );
}
