import { getServerSupabase } from "./supabase";
import type { BestPriceResult, PriceSnapshot, StoreId } from "./types";

/**
 * Devuelve el mejor precio actual por producto (de la view `latest_prices`).
 * Filtra opcionalmente por CP.
 */
export async function getBestPrices(
  productIds: string[],
  postalCode?: string
): Promise<Map<string, BestPriceResult>> {
  if (productIds.length === 0) return new Map();

  const sb = getServerSupabase();
  let q = sb
    .from("latest_prices")
    .select("*")
    .in("product_id", productIds)
    .eq("in_stock", true);

  // CP exacto si lo hay; si no, snapshots con postal_code null (nacional)
  if (postalCode) {
    q = q.or(`postal_code.eq.${postalCode},postal_code.is.null`);
  } else {
    q = q.is("postal_code", null);
  }

  const { data } = await q;
  if (!data) return new Map();

  // Agrupa por product_id y elige el más barato
  const grouped = new Map<string, PriceSnapshot[]>();
  for (const row of data) {
    const snap: PriceSnapshot = {
      productId: row.product_id,
      storeId: row.store_id as StoreId,
      postalCode: row.postal_code ?? undefined,
      priceMxn: Number(row.price_mxn),
      pricePerUnit: row.price_per_unit ? Number(row.price_per_unit) : undefined,
      inStock: row.in_stock,
      promoLabel: row.promo_label ?? undefined,
      sourceUrl: row.source_url ?? undefined,
      scrapedAt: row.scraped_at,
    };
    const arr = grouped.get(snap.productId) ?? [];
    arr.push(snap);
    grouped.set(snap.productId, arr);
  }

  const result = new Map<string, BestPriceResult>();
  for (const [productId, snaps] of grouped) {
    if (snaps.length === 0) continue;
    const sorted = [...snaps].sort((a, b) => a.priceMxn - b.priceMxn);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    result.set(productId, {
      productId,
      bestStore: best.storeId,
      bestPriceMxn: best.priceMxn,
      savingsVsWorst: Number((worst.priceMxn - best.priceMxn).toFixed(2)),
      allPrices: sorted,
    });
  }
  return result;
}

/** Para el UI: total más barato si compraras cada item donde sale más barato. */
export function cheapestBasketTotal(
  bestPrices: Map<string, BestPriceResult>
): { total: number; byStore: Record<StoreId, number> } {
  let total = 0;
  const byStore = {} as Record<StoreId, number>;
  for (const r of bestPrices.values()) {
    total += r.bestPriceMxn;
    byStore[r.bestStore] = (byStore[r.bestStore] ?? 0) + r.bestPriceMxn;
  }
  return { total: Number(total.toFixed(2)), byStore };
}
