"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { marcarFavorito, vetarComida } from "@/lib/actions/nutrition";
import type { Comida } from "@/lib/nutrition/types";
import GameIcon from "@/app/_components/GameIcon";

// La palomita del menú (spec del founder): cada alimento se califica.
// 👍 (chispa) = favorito — el motor lo prefiere en planes futuros.
// ✕ = no me gustó — se CAMBIA en automático por un equivalente y el veto se
// recuerda para siempre. El swap es capa S: el platillo nuevo entra con
// anim-chip-in tras el refresh del server (el plan ya viene cambiado).
export default function ComidaInteractiva({
  diaIdx,
  comidaIdx,
  comida,
  esFavorito,
}: {
  diaIdx: number;
  comidaIdx: number;
  comida: Comida;
  esFavorito: boolean;
}) {
  const t = useTranslations("nutricion");
  const router = useRouter();
  const [fav, setFav] = useState(esFavorito);
  const [estado, setEstado] = useState<"idle" | "swapping" | "swapped">("idle");
  const [pending, start] = useTransition();

  function like() {
    setFav((f) => !f); // optimista — la action confirma
    start(async () => {
      const r = await marcarFavorito(comida.nombre);
      if (r.ok) setFav(r.data.favorito);
      else setFav(esFavorito);
    });
  }

  function dislike() {
    setEstado("swapping");
    start(async () => {
      const r = await vetarComida({ diaIdx, comidaIdx });
      if (!r.ok) {
        setEstado("idle");
        return;
      }
      navigator.vibrate?.(12);
      setEstado("swapped");
      router.refresh(); // el platillo nuevo llega del server (jamás inventado)
      setTimeout(() => setEstado("idle"), 1600);
    });
  }

  return (
    <div className={estado === "swapped" ? "chip-delta" : undefined}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[9px] mono uppercase tracking-widest text-signal/80">
            {comida.tipo}
          </div>
          <div className="text-sm font-medium leading-snug">
            {estado === "swapping" ? t("swapping") : comida.nombre}
          </div>
          <div className="text-[10px] mono opacity-45 mt-0.5 tabular-nums">
            {comida.kcal} kcal · {comida.prot}p
          </div>
        </div>
        {/* palomitas: gustó / no gustó */}
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button
            type="button"
            disabled={pending}
            onClick={like}
            aria-pressed={fav}
            aria-label={t("likeAria")}
            title={t("likeAria")}
            className="inline-flex items-center justify-center w-7 h-7 rounded-[8px] transition-colors disabled:opacity-40"
            style={
              fav
                ? {
                    color: "var(--mode-coop-deep)",
                    background: "color-mix(in srgb, var(--mode-coop) 16%, transparent)",
                  }
                : { color: "var(--c-ink)", opacity: 0.35 }
            }
          >
            <GameIcon name="chispa" size={13} filled={fav} />
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={dislike}
            aria-label={t("dislikeAria")}
            title={t("dislikeAria")}
            className="inline-flex items-center justify-center w-7 h-7 rounded-[8px] text-sm leading-none transition-colors hover:bg-rival/10 disabled:opacity-40"
            style={{ color: "var(--mode-rival-deep)", opacity: 0.55 }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
