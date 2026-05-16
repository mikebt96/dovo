"use client";

import { useEffect, useState } from "react";

export type Tier = "high" | "mid" | "low";

/**
 * Detecta capacidades del dispositivo para decidir niveles de fidelidad 3D:
 * - high: DPR full, postFX habilitados, 60fps
 * - mid:  DPR cap 1.5, postFX off, 60fps
 * - low:  DPR 1, postFX off, 30fps, simplificar shaders
 *
 * Conservador por defecto — preferimos perder un poco de fidelidad antes
 * que jankear en un Pixel 6a o iPhone SE.
 */
export function useDeviceCapability(): Tier {
  const [tier, setTier] = useState<Tier>("high");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 8;
    const memory =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const dpr = window.devicePixelRatio || 1;
    const small = window.innerWidth < 640;

    if (cores < 4 || memory < 4) {
      setTier("low");
    } else if (cores < 6 || memory < 6 || (small && dpr > 2)) {
      setTier("mid");
    } else {
      setTier("high");
    }
  }, []);

  return tier;
}
