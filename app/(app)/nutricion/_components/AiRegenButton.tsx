"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { regenerateWithAi } from "@/lib/actions/nutrition";
import GameIcon from "@/app/_components/GameIcon";

// "Personalizar con IA". Fail-soft: con IA apagada NO llama nada — muestra
// "disponible al activar IA" (greyed, roadmap F5). Con IA viva regenera el plan semanal.
export default function AiRegenButton({ aiLive }: { aiLive: boolean }) {
  const t = useTranslations("nutricion");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if (!aiLive) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-[10px] mono uppercase tracking-[0.16em] opacity-50">
        <GameIcon name="chispa" size={11} className="inline -mt-px" />
        {t("aiSoon")}
      </span>
    );
  }

  function onClick() {
    setMsg(null);
    startTransition(async () => {
      const res = await regenerateWithAi();
      if (!res.ok) setMsg(res.error === "coming_soon" ? t("aiSoon") : res.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-signal text-white px-4 py-2 text-[10px] mono uppercase tracking-[0.16em] hover:bg-[#5a37e0] transition-colors disabled:opacity-60"
      >
        <GameIcon name="chispa" size={11} className="inline -mt-px" />
        {pending ? t("aiWorking") : t("aiRegen")}
      </button>
      {msg && (
        <span className="text-[10px] mono uppercase tracking-wider text-rival-deep">{msg}</span>
      )}
    </span>
  );
}
