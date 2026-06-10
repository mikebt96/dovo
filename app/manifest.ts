import type { MetadataRoute } from "next";

// PWA manifest — la base de la "app" instalable en Android (WebAPK) e iOS (A2HS).
// Colores del sistema Ultraviolet (DESIGN.md §2): papel #f4f4f6 / black-violet #07060d.
// Android acepta el SVG; los PNG 192/512 maskable se sirven para máxima compatibilidad.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "dovo — stronger in pairs",
    short_name: "dovo",
    description: "Fitness en dúo: tu esfuerzo real, normalizado y gamificado.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f4f6",
    theme_color: "#07060d",
    categories: ["fitness", "health", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Check-in", url: "/", description: "Registra tu sesión de hoy" },
      { name: "Tabla", url: "/leaderboard", description: "Leaderboard de dúos" },
      { name: "Retos", url: "/retos", description: "Duelos dúo vs dúo" },
    ],
  };
}
