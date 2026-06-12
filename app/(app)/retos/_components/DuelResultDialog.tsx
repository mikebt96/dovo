"use client";

import { vibrateJackpot } from "@/lib/juice";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { crearReto, type HeadToHead, type Marcador } from "@/lib/actions/retos";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { GAME_COLORS } from "@/lib/ui/game-colors";
import CardHalo from "@/app/_components/CardHalo";

// Ceremonia W/L del duelo (directiva §4.8): nadie gana una guerra de 7 días
// con un router.refresh(). Al primer open tras el cierre (visto por reto_id en
// localStorage): letter grade por margen (S >30% · A 10–30% · B <10%),
// GANARON/PERDIERON gigante, count-up del marcador final, head-to-head y
// REVANCHA que pre-llena el reto contra el mismo dúo (Kilduff: la rivalidad
// histórica es el retention hook). Victoria = confetti (la única micro-dep,
// lazy, ≤80 partículas, off con reduced-motion). Derrota = desaturación y
// CERO burla (regla §8.7) — el CTA es la revancha, no el luto.
export default function DuelResultDialog({
  m,
  miTratoId,
  h2h,
  ganadorTratoId,
}: {
  m: Marcador;
  miTratoId: string;
  h2h: HeadToHead;
  // veredicto OFICIAL de cerrar_reto — el marcador es display; esto es la verdad
  ganadorTratoId: string | null;
}) {
  const t = useTranslations("retos");
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [seen, setSeen] = useState(true); // SSR-safe: decide en effect
  const [rematch, setRematch] = useState<"idle" | "sent">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const mineIsA = m.trato_a === miTratoId;
  const miPuntos = Number(mineIsA ? m.puntos_a : m.puntos_b);
  const rivalPuntos = Number(mineIsA ? m.puntos_b : m.puntos_a);
  const rivalNombre = mineIsA ? m.nombre_b : m.nombre_a;
  const rivalTratoId = mineIsA ? m.trato_b : m.trato_a;

  const result: "won" | "lost" | "tied" =
    ganadorTratoId === null ? "tied" : ganadorTratoId === miTratoId ? "won" : "lost";

  const total = miPuntos + rivalPuntos;
  const margen = total > 0 ? Math.abs(miPuntos - rivalPuntos) / total : 0;
  const grade = margen > 0.3 ? "S" : margen >= 0.1 ? "A" : "B";

  const miCount = useCountUp(seen ? 0 : miPuntos, 800);
  const rivalCount = useCountUp(seen ? 0 : rivalPuntos, 800);

  useEffect(() => {
    const key = `dovo_duel_seen_${m.reto_id}`;
    if (localStorage.getItem(key)) return; // ya ceremoniado
    localStorage.setItem(key, "1");
    setSeen(false);
  }, [m.reto_id]);

  useEffect(() => {
    if (seen) return;
    ref.current?.showModal();
    if (result === "won") {
      vibrateJackpot();
      // capa L: confetti canvas, lazy, jamás en derrota ni empate
      void import("canvas-confetti").then(({ default: confetti }) => {
        confetti({
          particleCount: 80,
          spread: 75,
          startVelocity: 38,
          origin: { y: 0.6 },
          // GAME_COLORS.gold: confetti pinta en canvas — no resuelve var(--mode-gold)
          colors: [GAME_COLORS.gold, "#6d4aff", "#aef03c", "#ffffff"],
          disableForReducedMotion: true,
        });
      });
    }
  }, [seen, result]);

  if (seen) return null;

  function revancha() {
    setErr(null);
    start(async () => {
      const r = await crearReto({ miTratoId, rivalTratoId });
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setRematch("sent");
      router.refresh();
    });
  }

  const bigWord =
    result === "won" ? t("duelWon") : result === "lost" ? t("duelLost") : t("duelTied");

  return (
    <dialog
      ref={ref}
      className="dlg-game"
      aria-label={t("duelEyebrow")}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div
        className="card-game relative overflow-hidden p-8 sm:p-10 text-white text-center"
        style={result === "lost" ? { filter: "grayscale(0.6)" } : undefined}
      >
        <CardHalo
          position="center"
          color={result === "won" ? "var(--mode-gold)" : "var(--game-muted)"}
          opacity={result === "won" ? 0.5 : 0.15}
        />

        <p className="relative text-[11px] mono uppercase tracking-[0.26em] text-white/50">
          {t("duelEyebrow")} · {t("vs")} {rivalNombre}
        </p>

        {/* clímax: la palabra entra con slam; grade solo en victoria */}
        <div className="relative mt-5">
          <div
            className="anim-slam display font-black lowercase leading-none text-[clamp(3rem,16vw,4.5rem)]"
            style={
              result === "won"
                ? { color: "var(--mode-gold)", textShadow: "0 0 44px rgba(240,199,90,0.5)" }
                : { color: "rgba(255,255,255,0.85)" }
            }
          >
            {bigWord}
          </div>
          {result === "won" && (
            <span
              className="chip-delta absolute -top-2 right-2 inline-flex items-center justify-center w-10 h-10 rounded-[10px] display font-black text-xl"
              style={
                {
                  background: "color-mix(in srgb, var(--mode-gold) 22%, transparent)",
                  color: "var(--mode-gold)",
                  transform: "rotate(8deg)",
                  "--anim-delay": "450ms",
                } as React.CSSProperties
              }
            >
              {grade}
            </span>
          )}
        </div>

        {/* marcador final con count-up — dos temperaturas (§4.7) */}
        <div className="relative mt-5 flex items-baseline justify-center gap-4 display font-extrabold tabular-nums text-3xl">
          <span
            style={{
              textShadow: "0 0 24px color-mix(in srgb, var(--c-signal) 45%, transparent)",
            }}
          >
            {miCount}
          </span>
          <span className="text-white/30 text-base">{t("vs")}</span>
          <span style={{ color: "var(--mode-rival)" }}>{rivalCount}</span>
        </div>

        {/* head-to-head: la rivalidad tiene historia */}
        {h2h.yo + h2h.rival + h2h.empates > 0 && (
          <p className="relative mt-4 text-[11px] mono uppercase tracking-[0.18em] text-white/45 tabular-nums">
            {t("h2h", { yo: h2h.yo, rival: h2h.rival })}
          </p>
        )}

        {rematch === "sent" ? (
          <p className="relative mt-7 text-[12px] mono uppercase tracking-[0.16em] text-signal-on-game">
            {t("rematchSent")}
          </p>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={revancha}
            className="btn-game relative mt-7 w-full py-3 text-white display font-semibold lowercase disabled:opacity-60"
            style={
              result === "lost"
                ? ({ "--btn-color": "var(--mode-rival)" } as React.CSSProperties)
                : undefined
            }
          >
            {pending ? t("creating") : t("rematch")}
          </button>
        )}
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="relative mt-3 w-full py-2 text-[11px] mono uppercase tracking-[0.16em] text-white/50"
        >
          {t("duelClose")}
        </button>
        {err && <p className="relative text-xs text-rival mt-2">{err}</p>}
      </div>
    </dialog>
  );
}
