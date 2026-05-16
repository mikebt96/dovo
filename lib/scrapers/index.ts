import { walmartScraper } from "./walmart";
import { makeHtmlScraper } from "./html-generic";
import type { StoreScraper } from "./base";

/**
 * Generic JSON-LD pattern usado por la mayoría de e-commerces MX (VTEX, Shopify, Magento).
 * Captura `"name":"X" ... "price":"Y"` o `"price":Y` dentro de un objeto Product.
 */
const VTEX_JSONLD =
  /"@type"\s*:\s*"Product"[\s\S]*?"name"\s*:\s*"([^"]+)"[\s\S]*?"price"\s*:\s*"?(\d+(?:\.\d+)?)"?/g;

const sorianaScraper = makeHtmlScraper({
  storeId: "soriana",
  buildSearchUrl: (q) =>
    `https://www.soriana.com/buscador?Ntt=${encodeURIComponent(q)}`,
  productJsonLdRegex: VTEX_JSONLD,
});

const chedrauiScraper = makeHtmlScraper({
  storeId: "chedraui",
  buildSearchUrl: (q) =>
    `https://www.chedraui.com.mx/${encodeURIComponent(q.replaceAll(" ", "-"))}?_q=${encodeURIComponent(q)}`,
  productJsonLdRegex: VTEX_JSONLD,
});

const sumesaScraper = makeHtmlScraper({
  storeId: "sumesa",
  buildSearchUrl: (q) =>
    `https://www.sumesa.com.mx/${encodeURIComponent(q.replaceAll(" ", "-"))}?_q=${encodeURIComponent(q)}`,
  productJsonLdRegex: VTEX_JSONLD,
});

export const SCRAPERS: Record<string, StoreScraper> = {
  walmart: walmartScraper,
  soriana: sorianaScraper,
  chedraui: chedrauiScraper,
  sumesa: sumesaScraper,
};

export function getScraper(storeId: string): StoreScraper | null {
  return SCRAPERS[storeId] ?? null;
}
