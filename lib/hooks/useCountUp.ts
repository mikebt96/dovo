"use client";

import { prefersReducedMotion } from "@/lib/juice";

import { useEffect, useRef, useState } from "react";

// Count-up de número de juego (directiva §4.10): rAF + ease-out cúbico,
// extraído de DuelScoreboard. Anima desde el VALOR PREVIO al cambiar (no desde
// 0 en cada re-render; desde 0 solo en mount). reduced-motion: salto directo.
export function useCountUp(target: number, ms = 800): number {
  const [v, setV] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const from = fromRef.current;
    fromRef.current = target;
    if (reduced || from === target) {
      setV(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / ms);
      setV(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return v;
}
