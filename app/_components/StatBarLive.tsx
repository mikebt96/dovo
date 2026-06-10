"use client";

import { useEffect, useRef, useState } from "react";

// Barra fantasma de dos capas (directiva del consejo §4.2 — "provisional damage"
// de fighting game). Al SUBIR: la ghost salta al valor nuevo al instante (la
// ganancia se ve translúcida) y el fill la alcanza con spring 450ms. Al BAJAR:
// el fill cae con spring y la ghost drena 800ms linear con delay 400ms.
// React preserva el estado del island a través de router.refresh(), así que el
// old→new ocurre solo con el flujo actual de CheckinRow (sin props extra).
// scaleX/scaleY (compositor), nunca width/height — regla dura §3.
// reduced-motion: .bar-fill/.bar-ghost no tienen transición → salto al valor
// final, feedback informativo intacto.
export default function StatBarLive({
  pct,
  color,
  orientation = "h",
  trackClass = "bg-white/[0.08]",
  className = "",
  ariaLabel,
}: {
  pct: number; // 0..100
  color: string; // CSS color (p.ej. "var(--c-signal)" o "var(--stat-fue)")
  orientation?: "h" | "v";
  trackClass?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  // Mount: arranca en 0 para que la barra se LLENE al entrar (game-feel F12,
  // ahora con spring). El primer efecto la lleva al valor real.
  const [fill, setFill] = useState(0);
  const [ghost, setGhost] = useState(0);
  const [ghostInstant, setGhostInstant] = useState(true);
  const prev = useRef(0);

  useEffect(() => {
    if (clamped === prev.current) return;
    const up = clamped > prev.current;
    prev.current = clamped;
    if (up) {
      // la ghost marca YA el total nuevo; el fill la persigue con spring
      setGhostInstant(true);
      setGhost(clamped);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setFill(clamped);
          setGhostInstant(false);
        }),
      );
    } else {
      setGhostInstant(false);
      setFill(clamped);
      setGhost(clamped); // drena con la transición delayed de .bar-ghost
    }
  }, [clamped]);

  const axis = orientation === "h" ? "scaleX" : "scaleY";
  const origin = orientation === "h" ? "left" : "bottom";

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={`relative overflow-hidden ${trackClass} ${className}`}
    >
      <div
        aria-hidden
        className="bar-ghost absolute inset-0"
        style={{
          background: color,
          opacity: 0.28,
          transform: `${axis}(${ghost / 100})`,
          transformOrigin: origin,
          ...(ghostInstant ? { transition: "none" } : null),
        }}
      />
      <div
        aria-hidden
        className="bar-fill absolute inset-0"
        style={{
          background: color,
          transform: `${axis}(${fill / 100})`,
          transformOrigin: origin,
        }}
      />
    </div>
  );
}
