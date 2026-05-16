"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Auto-refresh trigger para fotos con análisis pendiente.
 *
 * Patrón: el upload action dispara `analyzeBodyPhoto` fire-and-forget. La
 * primera vez que vuelve la página, la foto está en `meals_log` pero
 * `ai_analysis` aún es null. Sin este componente, el user vería
 * "analizando…" indefinidamente hasta refrescar a mano.
 *
 * Solución: cuando la PhotoCard detecta `analysis === null`, monta este
 * AnalysisPoller. El componente llama `router.refresh()` cada 5s — re-runs
 * el server component, re-query a DB. Cuando ai_analysis ya existe, la
 * siguiente render NO incluye AnalysisPoller (porque la condición cambia)
 * y el ciclo se detiene solo.
 *
 * Cap a 30s (6 iteraciones) para no spammear DB si el AI call falló sin
 * persistir el caveat por algún edge case. Después de 30s el user puede
 * usar "Reanalizar" manualmente.
 */
export default function AnalysisPoller() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    const timeout = setTimeout(() => clearInterval(interval), 30_000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [router]);

  return null;
}
