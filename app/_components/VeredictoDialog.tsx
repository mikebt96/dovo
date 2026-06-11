"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { marcarVeredictoVisto, type Veredicto } from "@/lib/actions/trato";
import { useCountUp } from "@/lib/hooks/useCountUp";

// El Veredicto del Domingo (directiva §4.14 v1 · signature move §6.4): el
// domingo 23:59 CDMX el cron juzga el trato; al PRIMER open de la semana, la
// app lo ceremonia UNA vez (visto persistido en DB — no se repite entre
// devices). Sellada = ceremonia dorada con los discos pulsando desfasados.
// Rota = gris, CERO luto recurrente: el récord se preserva en grande y el CTA
// apunta a la revancha (regla §8.6 — jamás contador en cero sin contexto).
export default function VeredictoDialog({
  tratoId,
  veredicto,
}: {
  tratoId: string;
  veredicto: Veredicto;
}) {
  const t = useTranslations("veredicto");
  const ref = useRef<HTMLDialogElement>(null);
  const sellada = veredicto.tipo === "sellada";
  const racha = useCountUp(sellada ? veredicto.racha : 0, 900);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    dlg.showModal();
    // visto AL ABRIR: un refresh no repite la ceremonia (las L son raras §3)
    void marcarVeredictoVisto(tratoId, veredicto.week);
    if (sellada) navigator.vibrate?.([40, 40, 90]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <dialog
      ref={ref}
      className="dlg-game"
      aria-label={t("eyebrow")}
      onClick={() => ref.current?.close()}
    >
      <div className="card-game relative overflow-hidden p-8 sm:p-10 text-white text-center">
        {/* halo de ceremonia — dorado si selló, apagado si se rompió */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl"
          style={{
            opacity: sellada ? 0.45 : 0.15,
            background: `radial-gradient(circle, color-mix(in srgb, ${
              sellada ? "#f0c75a" : "#9aa0ae"
            } 55%, transparent), transparent 70%)`,
          }}
        />

        <p className="relative text-[11px] mono uppercase tracking-[0.26em] text-white/50">
          {t("eyebrow")}
        </p>

        {/* los dos discos del mark: pulsan desfasados si sellaron; grises si no */}
        <div className="relative mt-6 flex items-center justify-center gap-2.5" aria-hidden>
          {[0, 1].map((i) => (
            <span
              key={i}
              className={sellada ? "anim-breathe inline-block" : "inline-block"}
              style={{ "--anim-delay": `${i * 1800}ms` } as React.CSSProperties}
            >
              <span
                className="block w-8 h-8 rounded-full"
                style={
                  sellada
                    ? { background: "#f0c75a", boxShadow: "0 0 24px rgba(240,199,90,0.45)" }
                    : { border: "2px solid rgba(255,255,255,0.25)", filter: "grayscale(1)" }
                }
              />
            </span>
          ))}
        </div>

        {sellada ? (
          <>
            <div
              className="anim-slam relative mt-4 display font-extrabold leading-none tabular-nums text-[clamp(4.5rem,24vw,7rem)]"
              style={{
                color: "#ffb454",
                textShadow: "0 0 44px color-mix(in srgb, #ffb454 50%, transparent)",
              }}
            >
              {racha}
            </div>
            <p className="relative display font-bold lowercase text-lg text-white/90">
              {t("sealedTitle")}
            </p>
            <p className="relative mt-1 text-[11px] mono uppercase tracking-[0.18em] text-white/50 tabular-nums">
              {veredicto.racha >= veredicto.record
                ? t("newRecord")
                : t("sealedSub", { n: veredicto.racha })}
            </p>
          </>
        ) : (
          <>
            <p className="relative mt-5 display font-bold lowercase text-2xl text-white/85">
              {t("brokenTitle")}
            </p>
            {/* el récord NUNCA se borra — es la razón para volver */}
            <p
              className="relative mt-3 display font-extrabold tabular-nums text-4xl"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              {veredicto.record} <span className="text-base font-bold">sem</span>
            </p>
            <p className="relative mt-1 text-[11px] mono uppercase tracking-[0.18em] text-white/45">
              {t("brokenSub")}
            </p>
          </>
        )}

        {sellada ? (
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="btn-game relative mt-7 w-full py-3 text-white display font-semibold lowercase"
          >
            {t("cta")}
          </button>
        ) : (
          <Link
            href="/entrenamiento"
            onClick={() => ref.current?.close()}
            className="btn-game relative mt-7 block w-full py-3 text-white display font-semibold lowercase"
          >
            {t("brokenCta")}
          </Link>
        )}
      </div>
    </dialog>
  );
}
