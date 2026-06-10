import type { MetadataRoute } from "next";

// SEO: indexar solo las superficies públicas; la app autenticada queda fuera.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/landing", "/showcase", "/sign-up", "/sign-in", "/privacidad", "/terminos"],
        disallow: [
          "/api/",
          "/leaderboard",
          "/retos",
          "/nutricion",
          "/recompensas",
          "/perfil",
          "/ajustes",
          "/suscripcion",
          "/grupo/",
          "/onboarding/",
          "/invite/",
          "/auth/",
        ],
      },
    ],
    sitemap: "https://dovofit.com/sitemap.xml",
  };
}
