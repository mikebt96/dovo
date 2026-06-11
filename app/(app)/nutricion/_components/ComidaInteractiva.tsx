"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { marcarFavorito, vetarComida } from "@/lib/actions/nutrition";
import type { Comida } from "@/lib/nutrition/types";
import GameIcon from "@/app/_components/GameIcon";

// Submenú por comida (spec del founder): dentro del día, cada comida
// (desayuno / comida / colación / cena) es su propio desplegable con el
// platillo en el summary y CÓMO COCINARLO adentro (pasos del recetario).
// Palomitas: chispa = favorito · ✕ = no me gustó → swap automático + veto
// eterno. Los botones viven FUERA del summary para no pelear con el toggle.
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
    <details
      className={`group/comida rounded-xl border border-ink/8 ${
        estado === "swapped" ? "chip-delta" : ""
      }`}
    >
      <summary className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
        <span className="min-w-0">
          <span className="block text-[9px] mono uppercase tracking-widest text-signal/80">
            {t(`tipo.${comida.tipo}`)}
          </span>
          <span className="block text-sm font-medium leading-snug truncate">
            {estado === "swapping" ? t("swapping") : comida.nombre}
          </span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] mono opacity-45 tabular-nums">
            {comida.kcal} kcal
          </span>
          <span
            aria-hidden
            className="text-[10px] mono opacity-40 transition-transform group-open/comida:rotate-180"
          >
            ▾
          </span>
        </span>
      </summary>

      <div className="px-3 pb-3 pt-1 border-t border-ink/8">
        <p className="text-xs opacity-65 leading-relaxed">{comida.descripcion}</p>
        <p className="text-[10px] mono opacity-45 mt-1 tabular-nums">
          {comida.prot}p · {comida.carb}c · {comida.grasa}g
        </p>

        {/* cómo cocinarlo — el recetario del plan */}
        {comida.preparacion && comida.preparacion.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] mono uppercase tracking-[0.18em] text-signal-deep mb-1.5">
              {t("comoPreparar")}
            </p>
            <ol className="space-y-1">
              {comida.preparacion.map((paso, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed opacity-80">
                  <span className="mono tabular-nums opacity-50 shrink-0">{i + 1}.</span>
                  <span>{paso}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* palomitas: gustó / no gustó */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={like}
            aria-pressed={fav}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] mono uppercase tracking-[0.12em] border transition-colors disabled:opacity-40"
            style={
              fav
                ? {
                    color: "var(--mode-coop-deep)",
                    borderColor: "color-mix(in srgb, var(--mode-coop) 50%, transparent)",
                    background: "color-mix(in srgb, var(--mode-coop) 12%, transparent)",
                  }
                : { borderColor: "color-mix(in srgb, var(--c-ink) 15%, transparent)", opacity: 0.6 }
            }
          >
            <GameIcon name="chispa" size={11} filled={fav} />
            {fav ? t("liked") : t("like")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={dislike}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] mono uppercase tracking-[0.12em] border transition-colors hover:border-rival/50 disabled:opacity-40"
            style={{
              color: "var(--mode-rival-deep)",
              borderColor: "color-mix(in srgb, var(--c-ink) 15%, transparent)",
              opacity: 0.75,
            }}
          >
            ✕ {t("dislike")}
          </button>
        </div>
      </div>
    </details>
  );
}
