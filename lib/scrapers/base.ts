import type { StoreId, CanonicalProduct } from "../types";

export interface ScrapedPrice {
  productId: string;
  storeId: StoreId;
  postalCode?: string;
  priceMxn: number;
  pricePerUnit?: number;
  inStock: boolean;
  promoLabel?: string;
  sourceUrl?: string;
  matchedName?: string;
}

export interface StoreScraper {
  storeId: StoreId;
  /**
   * Devuelve el mejor match (más barato y relevante) para un producto canónico.
   * Si no encuentra nada, devuelve null.
   */
  fetchPrice(
    product: CanonicalProduct,
    opts: { postalCode?: string; queryOverride?: string }
  ): Promise<ScrapedPrice | null>;
}

/** Helper común: cuántos pesos por unidad base (g / ml / pieza). */
export function pricePerUnit(priceMxn: number, unitQty: number): number {
  if (unitQty <= 0) return priceMxn;
  return Number((priceMxn / unitQty).toFixed(4));
}

/**
 * Scoring básico para escoger entre múltiples resultados de búsqueda.
 * Mientras más alto, mejor match. El user puede ajustar pesos.
 */
export function scoreMatch(
  product: CanonicalProduct,
  candidate: { name: string; priceMxn: number; brand?: string }
): number {
  const name = candidate.name.toLowerCase();
  const target = product.canonicalName.toLowerCase();

  let score = 0;
  // Match exacto de tokens del nombre canónico
  for (const token of target.split(/\s+/)) {
    if (token.length > 2 && name.includes(token)) score += 10;
  }
  // Penalización por marcas premium si el producto canónico no las menciona
  if (!target.includes("kirkland") && name.includes("kirkland")) score -= 3;
  if (!target.includes("orgánico") && name.includes("orgánico")) score -= 2;
  // Penalización por precios outliers (probablemente paquete familiar/industrial)
  if (candidate.priceMxn > 500) score -= 5;
  return score;
}
