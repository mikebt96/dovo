"use client";

import { vibrateJackpot } from "@/lib/juice";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// SelloDelPacto (directiva §4.15): crear o aceptar el trato NO termina en un
// redirect seco — el pico de motivación se ceremonia. Los dos discos del mark
// entran desde lados opuestos (dos personas, una promesa, simétrica) y quedan
// respirando; "lo prometido es deuda" como juramento. Se dispara con ?sello=1
// (client-only: cero plomería de server) y limpia la URL al cerrar.
export default function SelloDelPacto() {
  const t = useTranslations("sello");
  const ref = useRef<HTMLDialogElement>(null);
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sello") !== "1") return;
    setActivo(true);
    // limpia la URL ya: un refresh no repite la ceremonia (las L son raras)
    params.delete("sello");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  useEffect(() => {
    if (!activo) return;
    ref.current?.showModal();
    vibrateJackpot();
  }, [activo]);

  if (!activo) return null;

  return (
    <dialog
      ref={ref}
      className="dlg-game"
      aria-label={t("title")}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="card-game relative overflow-hidden p-8 sm:p-10 text-white text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--c-signal) 55%, transparent), transparent 70%)",
          }}
        />

        {/* los dos discos: entran de lados opuestos, quedan respirando */}
        <div className="relative mt-2 flex items-center justify-center gap-3" aria-hidden>
          <span className="anim-sello-izq inline-block">
            <span
              className="anim-breathe block w-9 h-9 rounded-full"
              style={{
                background: "var(--c-signal)",
                boxShadow: "0 0 24px color-mix(in srgb, var(--c-signal) 45%, transparent)",
              }}
            />
          </span>
          <span className="anim-sello-der inline-block">
            <span
              className="anim-breathe block w-9 h-9 rounded-full"
              style={
                {
                  background: "var(--c-signal)",
                  boxShadow: "0 0 24px color-mix(in srgb, var(--c-signal) 45%, transparent)",
                  "--anim-delay": "1800ms",
                } as React.CSSProperties
              }
            />
          </span>
        </div>

        <p className="relative mt-6 display font-extrabold lowercase leading-tight text-3xl">
          {t("title")}
        </p>
        {/* el juramento — la frase ancla de la marca, ahora interfaz */}
        <p className="relative mt-3 text-[12px] mono uppercase tracking-[0.22em] text-white/60">
          {t("juramento")}
        </p>
        <p className="relative mt-3 text-xs text-white/55 leading-relaxed max-w-[26ch] mx-auto">
          {t("body")}
        </p>

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
