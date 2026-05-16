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
 * Scraper genérico HTML-regex para tiendas sin API pública.
 *
 * Cada tienda configura: searchUrl(q), selectores como regex.
 * Si el DOM cambia, el match falla graceful (null) y el cron lo registra.
 *
 * No usamos cheerio para evitar agregar dependencias. Las tiendas MX exponen
 * suficiente JSON-LD inline en su HTML para extraer precio + nombre con regex.
 */

export interface HtmlScraperConfig {
  storeId: StoreScraper["storeId"];
  buildSearchUrl: (query: string, postalCode?: string) => string;
  /**
   * Regex que matchea un JSON-LD Product. Debe capturar grupos:
   *   1: nombre, 2: precio numérico
   */
  productJsonLdRegex: RegExp;
  /** Fallback: si no hay JSON-LD, intenta esta regex sobre HTML crudo. */
  fallbackRegex?: RegExp;
}

export function makeHtmlScraper(cfg: HtmlScraperConfig): StoreScraper {
  return {
    storeId: cfg.storeId,
    async fetchPrice(product: CanonicalProduct, opts) {
      const query = opts.queryOverride ?? product.canonicalName;
      const url = cfg.buildSearchUrl(query, opts.postalCode);

      let html: string;
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": SCRAPER_UA,
            Accept: "text/html,application/xhtml+xml",
            "Accept-Language": "es-MX,es;q=0.9",
          },
          signal: AbortSignal.timeout(SCRAPER_TIMEOUT_MS),
        });
        if (!res.ok) {
          console.warn(`[${cfg.storeId}] ${product.id} HTTP ${res.status}`);
          return null;
        }
        html = await res.text();
      } catch (err) {
        console.warn(`[${cfg.storeId}] ${product.id} fetch failed:`, err);
        return null;
      }

      const candidates: Array<{ name: string; priceMxn: number }> = [];
      // Pass 1: JSON-LD
      for (const m of html.matchAll(cfg.productJsonLdRegex)) {
        const name = m[1];
        const price = Number(m[2]);
        if (name && Number.isFinite(price) && price > 0) {
          candidates.push({ name, priceMxn: price });
        }
      }
      // Pass 2: fallback regex
      if (candidates.length === 0 && cfg.fallbackRegex) {
        for (const m of html.matchAll(cfg.fallbackRegex)) {
          const name = m[1];
          const price = Number(m[2]);
          if (name && Number.isFinite(price) && price > 0) {
            candidates.push({ name, priceMxn: price });
          }
        }
      }

      if (candidates.length === 0) return null;

      const scored = candidates.slice(0, 10).map((c) => ({
        ...c,
        score: scoreMatch(product, c),
      }));
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (!best || best.score <= 0) return null;

      return {
        productId: product.id,
        storeId: cfg.storeId,
        postalCode: opts.postalCode,
        priceMxn: best.priceMxn,
        pricePerUnit: pricePerUnit(best.priceMxn, product.unitQty),
        inStock: true,
        sourceUrl: url,
        matchedName: best.name,
      } satisfies ScrapedPrice;
    },
  };
}
