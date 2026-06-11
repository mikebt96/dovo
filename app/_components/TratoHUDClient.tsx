"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { nudgeCompa } from "@/lib/actions/trato";
import GameIcon from "./GameIcon";

type Miembro = {
  userId: string;
  nombre: string;
  freq: number;
  semana: number;
  hoy: boolean;
  esYo: boolean;
};

const TZ = "America/Mexico_City";

function hoyCDMXClient(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

// 0 = lunes … 6 = domingo, en CDMX
function dowCDMX(): number {
  const d = new Date(hoyCDMXClient() + "T00:00:00Z");
  return (d.getUTCDay() + 6) % 7;
}

// Próximo Veredicto: domingo 23:59 CDMX = lunes 05:59 UTC (CDMX es UTC-6 fijo).
function msAlVeredicto(): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(5, 59, 0, 0);
  // avanza al próximo lunes estrictamente en el futuro
  while (next.getUTCDay() !== 1 || next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(5, 59, 0, 0);
  }
  return next.getTime() - now.getTime();
}

// TratoHUD (directiva §4.5): el estado del trato abre la home. DuoPulse (los
// discos del mark respiran desfasados cuando cada quien ya cumplió HOY),
// compliance semanal de AMBOS, racha del trato SIEMPRE en ámbar, countdown al
// Veredicto del Domingo y empujón al compa (copy pre-escrito, jamás culpa,
// 1/día). El riesgo se muestra con desaturación + pulso, nunca con vergüenza.
export default function TratoHUDClient({
  tratoId,
  miembros,
  racha,
}: {
  tratoId: string;
  miembros: Miembro[];
  racha: { current: number; max: number } | null;
}) {
  const t = useTranslations("trato");
  const [ms, setMs] = useState<number | null>(null);
  const [nudgeState, setNudgeState] = useState<"idle" | "confirm" | "sent">("idle");
  const [pending, start] = useTransition();

  // countdown por minuto (client-only: evita desfase de hidratación)
  useEffect(() => {
    setMs(msAlVeredicto());
    const id = setInterval(() => setMs(msAlVeredicto()), 60_000);
    return () => clearInterval(id);
  }, []);

  // rate-limit del empujón: 1/día (v1 localStorage — el tag del push colapsa repetidos)
  const nudgeKey = `dovo_nudge_${tratoId}_${hoyCDMXClient()}`;
  useEffect(() => {
    if (localStorage.getItem(nudgeKey)) setNudgeState("sent");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const yo = miembros.find((m) => m.esYo);
  const otros = miembros.filter((m) => !m.esYo);
  const compaPendiente = otros.find((m) => !m.hoy);
  const todosHoy = miembros.every((m) => m.hoy);

  // riesgo: a alguien le faltan más check-ins que días restantes de la semana,
  // o es jueves+ con ≥2 pendientes (directiva §4.5)
  const dow = dowCDMX();
  const diasRestantes = 7 - dow; // incluye hoy
  const enRiesgo =
    racha !== null &&
    racha.current > 0 &&
    miembros.some(
      (m) =>
        m.freq > 0 &&
        (m.freq - m.semana > diasRestantes ||
          (dow >= 3 && m.freq - m.semana >= 2)),
    );
  const rota = racha !== null && racha.current === 0 && racha.max > 0;

  function enviarNudge() {
    if (nudgeState === "idle") {
      setNudgeState("confirm");
      return;
    }
    if (nudgeState !== "confirm") return;
    start(async () => {
      const r = await nudgeCompa(tratoId);
      if (r.ok) {
        localStorage.setItem(nudgeKey, "1");
        setNudgeState("sent");
        navigator.vibrate?.(12);
      } else {
        setNudgeState("idle");
      }
    });
  }

  const statusLine = todosHoy
    ? t("statusBoth")
    : yo?.hoy && compaPendiente
      ? t("statusYouDone", { nombre: compaPendiente.nombre })
      : !yo?.hoy && otros.length > 0 && otros.every((m) => m.hoy)
        ? t("statusYouPending")
        : t("statusNone");

  const countdown =
    ms === null
      ? null
      : ms < 3_600_000
        ? t("judgedSoon")
        : t("judgedIn", {
            t:
              ms >= 86_400_000
                ? `${Math.floor(ms / 86_400_000)}d ${Math.floor((ms % 86_400_000) / 3_600_000)}h`
                : `${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`,
          });

  return (
    <section
      aria-label={t("eyebrow")}
      className="mb-6 rounded-2xl border border-ink/10 p-4 sm:p-5"
    >
      {/* fila 1: eyebrow + racha del trato (ámbar — léxico §2, eslabones §4.9) */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] mono uppercase tracking-[0.22em] opacity-50">
          {t("eyebrow")}
        </span>
        {racha !== null && (
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] mono uppercase tracking-[0.14em] tabular-nums ${
              enRiesgo ? "anim-risk" : ""
            }`}
            style={
              rota
                ? { color: "var(--c-ink)", opacity: 0.45 }
                : {
                    color: "var(--mode-racha)",
                    ...(enRiesgo ? { filter: "grayscale(0.8)" } : null),
                  }
            }
          >
            <GameIcon name="eslabones" size={13} />
            {t("rachaChip", { n: racha.current })}
          </span>
        )}
      </div>

      {/* fila 2: DuoPulse — el mark que vive (§6.2) */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5" aria-hidden>
          {miembros.map((m, i) => (
            <span
              key={m.userId}
              className={m.hoy ? "anim-breathe inline-block" : "inline-block"}
              style={{ "--anim-delay": `${i * 1800}ms` } as React.CSSProperties}
            >
              <span
                className="block w-6 h-6 rounded-full"
                style={
                  m.hoy
                    ? { background: "var(--c-signal)" }
                    : {
                        border: "1.5px solid color-mix(in srgb, var(--c-ink) 25%, transparent)",
                        filter: "grayscale(0.8)",
                      }
                }
              />
            </span>
          ))}
        </div>
        <p className="flex-1 text-[11px] mono uppercase tracking-[0.14em] opacity-70 min-w-0 truncate">
          {statusLine}
        </p>
        {compaPendiente && yo?.hoy && nudgeState !== "sent" && (
          <button
            type="button"
            disabled={pending}
            onClick={enviarNudge}
            className={`shrink-0 text-[10px] mono uppercase tracking-[0.14em] rounded-full px-3 py-1.5 transition-colors disabled:opacity-50 ${
              nudgeState === "confirm"
                ? "bg-signal text-white"
                : "border border-signal/40 text-signal-deep hover:border-signal"
            }`}
          >
            {nudgeState === "confirm" ? t("nudgeConfirm") : t("nudge")}
          </button>
        )}
        {nudgeState === "sent" && compaPendiente && (
          <span className="shrink-0 text-[10px] mono uppercase tracking-[0.14em] opacity-50">
            {t("nudgeSent")}
          </span>
        )}
      </div>

      {/* fila 3: compliance semanal de ambos — pills = freq objetivo */}
      <div className="mt-4 space-y-2">
        {miembros.map((m) => {
          const pills = Math.min(m.freq, 7);
          return (
            <div key={m.userId} className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-[11px] mono lowercase truncate opacity-70">
                {m.esYo ? t("tu") : m.nombre}
              </span>
              {m.freq > 0 ? (
                <>
                  <div className="flex items-center gap-1" aria-hidden>
                    {Array.from({ length: pills }, (_, i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={
                          i < Math.min(m.semana, pills)
                            ? { background: "var(--c-signal)" }
                            : {
                                border: "1px solid color-mix(in srgb, var(--c-ink) 18%, transparent)",
                              }
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[11px] mono tabular-nums opacity-60">
                    {m.semana}/{m.freq}
                  </span>
                </>
              ) : (
                <span className="text-[11px] mono lowercase opacity-45">
                  {t("noRoutine")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* fila 4: estado de la racha + countdown al Veredicto */}
      {(enRiesgo || rota) && (
        <p className="mt-3 text-[11px] mono lowercase tracking-[0.04em] opacity-70">
          {rota ? t("brokenCopy", { n: racha!.max }) : t("riskCopy")}
        </p>
      )}
      {countdown && (
        <p className="mt-3 pt-3 border-t border-ink/8 text-[10px] mono uppercase tracking-[0.18em] opacity-50 tabular-nums">
          {countdown}
        </p>
      )}
    </section>
  );
}
