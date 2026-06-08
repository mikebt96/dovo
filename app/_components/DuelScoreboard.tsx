"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  responderReto,
  cerrarRetoAction,
  type Marcador,
} from "@/lib/actions/retos";

function prefersReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function useCountUp(target: number, ms = 800): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (prefersReduced()) {
      setV(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export default function DuelScoreboard({
  m,
  miTratoId,
  canRespond,
}: {
  m: Marcador;
  miTratoId: string;
  canRespond: boolean;
}) {
  const t = useTranslations("retos");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const mineIsA = m.trato_a === miTratoId;
  const miNombre = mineIsA ? m.nombre_a : m.nombre_b;
  const miPuntos = Number(mineIsA ? m.puntos_a : m.puntos_b);
  const rivalNombre = mineIsA ? m.nombre_b : m.nombre_a;
  const rivalPuntos = Number(mineIsA ? m.puntos_b : m.puntos_a);

  const miCount = useCountUp(miPuntos);
  const rivalCount = useCountUp(rivalPuntos);

  const finMs = new Date(m.periodo_fin + "T00:00:00Z").getTime();
  const dias = Math.max(0, Math.ceil((finMs - Date.now()) / 86_400_000));
  const vencido = finMs <= Date.now();

  function act(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setErr(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) setErr(r.error ?? "error");
    });
  }

  return (
    <div
      className="rounded-[20px] p-6 text-white"
      style={{
        background:
          "radial-gradient(120% 120% at 50% 0%, #16132a 0%, #0b0a14 70%, #07060d 100%)",
      }}
    >
      <div className="flex items-center justify-between text-[11px] mono uppercase tracking-widest text-white/50">
        <span>
          {m.estado === "cerrado"
            ? t("ended")
            : m.estado === "propuesto"
              ? t("proposed")
              : vencido
                ? t("awaitClose")
                : dias <= 1
                  ? t("lastDay")
                  : t("daysLeft", { n: dias })}
        </span>
        <span>{t("active")}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-6">
        <div className="text-left">
          <div className="text-[11px] mono uppercase tracking-wider text-signal mb-1">
            {t("you")}
          </div>
          <div className="display font-semibold lowercase truncate">{miNombre}</div>
          <div
            className="display font-extrabold tabular-nums text-4xl mt-2"
            style={{ textShadow: "0 0 24px rgba(109,74,255,0.5)" }}
          >
            {miCount}
          </div>
        </div>

        <div className="display font-extrabold text-white/30 text-lg">
          {t("vs")}
        </div>

        <div className="text-right">
          <div className="text-[11px] mono uppercase tracking-wider text-stat-flex mb-1">
            {t("rival")}
          </div>
          <div className="display font-semibold lowercase truncate">
            {rivalNombre}
          </div>
          <div className="display font-extrabold tabular-nums text-4xl mt-2 text-white/90">
            {rivalCount}
          </div>
        </div>
      </div>

      {canRespond && m.estado === "propuesto" && (
        <div className="flex gap-2 mt-6">
          <button
            disabled={pending}
            onClick={() => act(() => responderReto(m.reto_id, "aceptar"))}
            className="flex-1 rounded-full bg-signal text-white py-2.5 display font-semibold lowercase disabled:opacity-50"
          >
            {t("accept")}
          </button>
          <button
            disabled={pending}
            onClick={() => act(() => responderReto(m.reto_id, "rechazar"))}
            className="flex-1 rounded-full border border-white/25 text-white/80 py-2.5 display font-semibold lowercase disabled:opacity-50"
          >
            {t("reject")}
          </button>
        </div>
      )}

      {!canRespond && m.estado === "propuesto" && (
        <p className="text-[11px] mono uppercase tracking-widest text-white/40 mt-5">
          {t("pending")}
        </p>
      )}

      {(m.estado === "activo" || m.estado === "aceptado") && vencido && (
        <button
          disabled={pending}
          onClick={() => act(() => cerrarRetoAction(m.reto_id))}
          className="w-full mt-6 rounded-full border border-white/25 text-white/80 py-2.5 display font-semibold lowercase disabled:opacity-50"
        >
          {t("close")}
        </button>
      )}

      {err && <p className="text-xs text-red-300 mt-3">{err}</p>}
    </div>
  );
}
