import type { CanonicalProduct } from "../types";
import {
  pricePerUnit,
  scoreMatch,
  SCRAPER_TIMEOUT_MS,
  SCRAPER_UA,
  type ScrapedPrice,
  type StoreScraper,
} from "./base";

/**
 * Walmart MX scraper.
 *
 * Usa el endpoint público de búsqueda (next-data style) que devuelve JSON.
 * NO requiere auth ni token. Sí respeta un user-agent normal.
 *
 * Endpoint: GET https://www.walmart.com.mx/api/page/search?q={query}&page=1
 *
 * Si Walmart cambia su API, los selectores fallan graceful (devolvemos null
 * y el caller lo registra en `scrape_runs`).
 */

interface WalmartProduct {
  id: string;
  name: string;
  brand?: string;
  price: { currentPrice: number; wasPrice?: number };
  availability?: { status: string };
  url?: string;
  imageUrl?: string;
}

export const walmartScraper: StoreScraper = {
  storeId: "walmart",

  async fetchPrice(product: CanonicalProduct, opts) {
    const query = opts.queryOverride ?? product.canonicalName;
    const url =
      `https://www.walmart.com.mx/api/page/search` +
      `?q=${encodeURIComponent(query)}&page=1`;

    let json: { products?: WalmartProduct[] };
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": SCRAPER_UA,
          Accept: "application/json",
          "Accept-Language": "es-MX,es;q=0.9",
          ...(opts.postalCode ? { "x-postal-code": opts.postalCode } : {}),
        },
        signal: AbortSignal.timeout(SCRAPER_TIMEOUT_MS),
      });
      if (!res.ok) {
        console.warn(`[walmart] ${product.id} HTTP ${res.status}`);
        return null;
      }
      json = await res.json();
    } catch (err) {
      console.warn(`[walmart] ${product.id} fetch failed:`, err);
      return null;
    }

    const candidates = json.products ?? [];
    if (candidates.length === 0) return null;

    // Top 5 candidatos, scored
    const scored = candidates.slice(0, 8).map((c) => ({
      raw: c,
      score: scoreMatch(product, {
        name: c.name,
        priceMxn: c.price.currentPrice,
        brand: c.brand,
      }),
    }));
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (!best || best.score <= 0) return null;

    const c = best.raw;
    const isPromo = c.price.wasPrice && c.price.wasPrice > c.price.currentPrice;

    return {
      productId: product.id,
      storeId: "walmart",
      postalCode: opts.postalCode,
      priceMxn: c.price.currentPrice,
      pricePerUnit: pricePerUnit(c.price.currentPrice, product.unitQty),
      inStock: c.availability?.status !== "OUT_OF_STOCK",
      promoLabel: isPromo
        ? `-${Math.round(((c.price.wasPrice! - c.price.currentPrice) / c.price.wasPrice!) * 100)}%`
        : undefined,
      sourceUrl: c.url ? `https://www.walmart.com.mx${c.url}` : undefined,
      matchedName: c.name,
    } satisfies ScrapedPrice;
  },
};
