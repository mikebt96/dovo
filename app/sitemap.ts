import type { MetadataRoute } from "next";

const BASE = "https://dovofit.com";

// Solo superficies públicas (las privadas están bloqueadas en robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/landing`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/showcase`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/sign-up`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
