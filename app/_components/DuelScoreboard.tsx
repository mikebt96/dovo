"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  responderReto,
  cerrarRetoAction,
  type Marcador,
} from "@/lib/actions/retos";
import { KNOWN_ERROR_CODES } from "@/lib/i18n/action-errors";
import { useCountUp } from "@/lib/hooks/useCountUp";

// Marcador v2 (directiva §4.7): dos lados, dos temperaturas — tú en violeta (la
// casa), el rival en --mode-rival (rojo dedicado; mata el bug del magenta FLE).
// El "vs" al 30% muere: lo reemplaza el diferencial vivo en chip diagonal
// (nada rival está a 90° — signature move §6.5). Barra de ventaja central de
// dos scaleX enfrentados. Vas perdiendo = tu lado desatura + copy sin
// eufemismos. Derrota jamás se burla (§8.7).
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
  const diff = miPuntos - rivalPuntos;
  const diffCount = useCountUp(Math.abs(diff));

  const total = miPuntos + rivalPuntos;
  const share = total > 0 ? miPuntos / total : 0.5;
  // margen ≥10% del total ⇒ estado "vas perdiendo/ganando" declarado
  const losing = total > 0 && diff < 0 && Math.abs(diff) >= total * 0.1;
  const winning = total > 0 && diff > 0 && Math.abs(diff) >= total * 0.1;

  // fin del duelo a medianoche CDMX (UTC-6 fijo, convención del repo)
  const finMs = new Date(m.periodo_fin + "T00:00:00-06:00").getTime();
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
      className="card-game p-6 text-white"
      style={{
        // nada rival está a 90°: el corte diagonal ES el conflicto (§6.5)
        clipPath: "polygon(0 0, 100% 2%, 99.2% 100%, 0.8% 97.5%)",
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
        <div
          className="text-left"
          style={losing ? { filter: "grayscale(0.5)" } : undefined}
        >
          <div className="text-[11px] mono uppercase tracking-wider text-signal-on-game mb-1">
            {t("you")}
          </div>
          <div className="display font-semibold lowercase truncate">{miNombre}</div>
          <div
            className="display font-extrabold tabular-nums text-4xl mt-2"
            style={{
              textShadow: `0 0 24px color-mix(in srgb, var(--c-signal) ${winning ? 60 : 45}%, transparent)`,
            }}
          >
            {miCount}
          </div>
        </div>

        {/* diferencial vivo en chip diagonal — reemplaza el "vs" muerto */}
        <div
          className="display font-extrabold tabular-nums text-base px-2.5 py-1 rounded-[10px]"
          style={{
            transform: "rotate(-8deg)",
            background:
              diff > 0
                ? "color-mix(in srgb, var(--color-signal-on-game) 28%, transparent)"
                : diff < 0
                  ? "color-mix(in srgb, var(--mode-rival) 28%, transparent)"
                  : "rgba(255,255,255,0.12)",
            color:
              diff > 0
                ? "var(--color-signal-on-game)"
                : diff < 0
                  ? "var(--mode-rival)"
                  : "rgba(255,255,255,0.6)",
          }}
        >
          {diff === 0 ? t("vs") : `${diff > 0 ? "+" : "−"}${diffCount}`}
        </div>

        <div className="text-right">
          <div
            className="text-[11px] mono uppercase tracking-wider mb-1"
            style={{ color: "var(--mode-rival)" }}
          >
            {t("rival")}
          </div>
          <div className="display font-semibold lowercase truncate">
            {rivalNombre}
          </div>
          <div
            className="display font-extrabold tabular-nums text-4xl mt-2"
            style={{
              textShadow:
                "0 0 24px color-mix(in srgb, var(--mode-rival) 45%, transparent)",
            }}
          >
            {rivalCount}
          </div>
        </div>
      </div>

      {/* barra de ventaja: dos scaleX enfrentados desde el centro (§4.7) */}
      <div className="relative h-2 mt-5 rounded-full overflow-hidden bg-white/[0.08]">
        <div
          className="bar-advantage absolute inset-y-0 left-0 w-1/2"
          style={{
            background: "var(--c-signal)",
            transform: `scaleX(${share * 2})`,
            transformOrigin: "left",
          }}
        />
        <div
          className="bar-advantage absolute inset-y-0 right-0 w-1/2"
          style={{
            background: "var(--mode-rival)",
            transform: `scaleX(${(1 - share) * 2})`,
            transformOrigin: "right",
          }}
        />
      </div>

      {losing && (
        <p className="mt-3 text-[11px] mono uppercase tracking-[0.16em] text-white/65">
          {t("losingBy", { n: Math.abs(diff) })}
        </p>
      )}

      {canRespond && m.estado === "propuesto" && (
        <div className="flex gap-2 mt-6">
          <button
            disabled={pending}
            onClick={() => act(() => responderReto(m.reto_id, "aceptar"))}
            className="btn-game flex-1 text-white py-2.5 display font-semibold lowercase disabled:opacity-50"
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

      {/* código conocido → i18n; lo demás tal cual (jamás t() con clave desconocida) */}
      {err && (
        <p className="text-xs text-rival mt-3">
          {KNOWN_ERROR_CODES.has(err) ? t(`err.${err}`) : err}
        </p>
      )}
    </div>
  );
}
