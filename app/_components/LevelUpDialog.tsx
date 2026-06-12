"use client";

import { vibrateJackpot } from "@/lib/juice";
import { STAT_SHORT, STAT_VAR } from "@/lib/leveling/display";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import type { StatKey } from "@/lib/scoring/types";
import type { TierUp } from "@/lib/actions/checkins";

// Ceremonia L (directiva del consejo §4.3): level-up y tier-up toman la pantalla
// UNA vez, con la anatomía de §3 (anticipación → hit-stop → clímax → settle) en
// ≤2.5s, skippable a un tap. <dialog>.showModal() = top layer (libre de Grain).
// Si coinciden level-up y tier-ups se ENCADENAN en el mismo dialog (regla 8).
// reduced-motion: dialog estático con el dato y el CTA — informativo intacto.

export type LevelUpData = {
  nivel: { antes: number; despues: number } | null;
  tierUps: TierUp[];
  xpParaSiguiente: number;
};

// 18 partículas DOM (≤20, regla M/L) con trayectorias deterministas por índice —
// sin Math.random en render para no pelear con la hidratación.
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const dist = 70 + (i % 3) * 38;
  return {
    dx: Math.round(Math.cos(angle) * dist),
    dy: Math.round(Math.sin(angle) * dist) - 30,
    delay: (i % 6) * 40,
  };
});

export default function LevelUpDialog({
  data,
  onClose,
}: {
  data: LevelUpData;
  onClose: () => void;
}) {
  const t = useTranslations("levelup");
  const ref = useRef<HTMLDialogElement>(null);

  const isLevelUp = !!data.nivel;
  const soloTier = !isLevelUp && data.tierUps.length > 0;
  const accent = soloTier ? STAT_VAR[data.tierUps[0].stat] : "var(--c-signal)";

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    dlg.showModal();
    // háptica de jackpot (Android; iOS no vibra — el slam comunica solo)
    vibrateJackpot();
    const close = () => onClose();
    dlg.addEventListener("close", close);
    return () => dlg.removeEventListener("close", close);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const particles = useMemo(() => PARTICLES, []);

  return (
    <dialog
      ref={ref}
      className="dlg-game"
      aria-label={
        isLevelUp ? t("title", { n: data.nivel!.despues }) : t("tierEyebrow")
      }
      onClick={() => ref.current?.close()}
    >
      <div className="card-game relative overflow-hidden p-8 sm:p-10 text-white text-center">
        {/* halo de ceremonia */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-50 blur-3xl"
          style={{
            background: `radial-gradient(circle, color-mix(in srgb, ${accent} 55%, transparent), transparent 70%)`,
          }}
        />

        <p className="relative text-[11px] mono uppercase tracking-[0.26em] text-white/50">
          {isLevelUp ? t("eyebrow") : t("tierEyebrow")}
        </p>

        {/* clímax: el número entra scale(3)→1 con overshoot + 18 partículas */}
        <div className="relative mt-5 mb-2">
          {particles.map((p, i) => (
            <span
              key={i}
              aria-hidden
              className="anim-particle absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full"
              style={
                {
                  background: accent,
                  "--dx": `${p.dx}px`,
                  "--dy": `${p.dy}px`,
                  animationDelay: `${120 + p.delay}ms`,
                } as React.CSSProperties
              }
            />
          ))}
          {isLevelUp ? (
            <div
              className="anim-slam display font-extrabold leading-none tabular-nums text-[clamp(5rem,28vw,8rem)]"
              style={{
                textShadow: `0 0 44px color-mix(in srgb, ${accent} 55%, transparent)`,
              }}
            >
              {data.nivel!.despues}
            </div>
          ) : (
            <div
              className="anim-slam display font-extrabold lowercase leading-none text-4xl sm:text-5xl"
              style={{
                color: accent,
                textShadow: `0 0 36px color-mix(in srgb, ${accent} 50%, transparent)`,
              }}
            >
              {data.tierUps[0].a}
            </div>
          )}
        </div>

        {isLevelUp && (
          <p className="relative display font-bold lowercase text-lg text-white/85">
            {t("title", { n: data.nivel!.despues })}
          </p>
        )}

        {/* settle: tier-ups encadenados (mismo dialog, jamás dos ceremonias) */}
        {data.tierUps.length > 0 && (
          <ul className="relative mt-5 space-y-1.5">
            {data.tierUps.map((tu, i) => (
              <li
                key={tu.stat}
                className="chip-delta inline-flex items-center gap-2 mx-1 rounded-[10px] px-3 py-1.5 text-[11px] mono uppercase tracking-[0.14em]"
                style={
                  {
                    background: `color-mix(in srgb, ${STAT_VAR[tu.stat]} 16%, transparent)`,
                    "--anim-delay": `${500 + i * 90}ms`,
                  } as React.CSSProperties
                }
              >
                <span
                  aria-hidden
                  className="w-2 h-2 rounded-full"
                  style={{ background: STAT_VAR[tu.stat] }}
                />
                {t("tierLine", { label: STAT_SHORT[tu.stat], tier: tu.a })}
              </li>
            ))}
          </ul>
        )}

        {isLevelUp && (
          <p className="relative mt-4 text-[11px] mono uppercase tracking-[0.18em] text-white/40 tabular-nums">
            {t("xpNext", { n: data.xpParaSiguiente })}
          </p>
        )}

        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="btn-game relative mt-7 w-full py-3 text-white display font-semibold lowercase"
        >
          {t("cta")}
        </button>
      </div>
    </dialog>
  );
}
