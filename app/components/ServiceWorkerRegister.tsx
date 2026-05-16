"use client";

import { useEffect } from "react";

/**
 * Registra /sw.js al mount. Solo en production — en dev causa más
 * problemas (HMR + cache stale) que beneficios.
 *
 * Si el navegador no soporta SW (Safari iOS <11.1, in-app browsers
 * de algunas redes sociales), simplemente no hace nada y la app
 * funciona online-only.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const url = "/sw.js";

    navigator.serviceWorker.register(url).catch((err) => {
      console.warn("[SW] register failed:", err);
    });

    // Si llega un SW nuevo y el viejo está activo, recargar al detectarlo.
    // Esto evita "ghost cache" de versiones viejas tras un deploy.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (document.visibilityState === "visible") {
        // Pequeño debounce para que el user no pierda interacción inmediata
        setTimeout(() => location.reload(), 100);
      }
    });
  }, []);

  return null;
}
