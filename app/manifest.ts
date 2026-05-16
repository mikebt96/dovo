import type { MetadataRoute } from "next";

/**
 * PWA manifest — auto-detectado por Next 15.
 * Se sirve en /manifest.webmanifest, inyectado en <head> automáticamente.
 *
 * Habilita:
 * - "Add to Home Screen" en iOS Safari + Android Chrome
 * - Splash screen con BG dark al abrir desde home screen
 * - Window mode "standalone" (sin chrome del navegador)
 *
 * Para PWA installable completa (Chrome prompt automático), faltan
 * PNG 192×192 y 512×512. Se añaden cuando arranquemos Fase A del SaaS
 * migration. Por ahora SVG + apple-icon cubren iOS + el "Add to Home
 * Screen" manual en ambas plataformas.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "dovo",
    short_name: "dovo",
    description:
      "Disciplina compartida en dúo. Tu plan semanal, sus rachas, sus recompensas reales.",
    start_url: "/",
    display: "standalone",
    background_color: "#08080a",
    theme_color: "#08080a",
    orientation: "portrait",
    lang: "es-MX",
    dir: "ltr",
    categories: ["lifestyle", "health", "fitness"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
