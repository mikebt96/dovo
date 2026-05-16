import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/data/products";
import { SCRAPERS } from "@/lib/scrapers";
import { getServerSupabase } from "@/lib/supabase";

/**
 * Cron: scrape diario de precios por tienda × producto × CP.
 *
 * Vercel cron → POST /api/cron/scrape-prices?store=walmart&cp=06600
 * Si no se pasan params, corre todas las tiendas activas con CPs de profiles.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  // Auth
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sb = getServerSupabase();
  const { searchParams } = new URL(req.url);
  const storeFilter = searchParams.get("store");
  const cpFilter = searchParams.get("cp");

  // Determina CPs a scrapear: si pasaron uno explícito, ese. Si no, los de profiles.
  let postalCodes: (string | undefined)[];
  if (cpFilter) {
    postalCodes = [cpFilter];
  } else {
    const { data: profs } = await sb
      .from("profiles")
      .select("postal_code")
      .not("postal_code", "is", null);
    const unique = new Set(profs?.map((p) => p.postal_code).filter(Boolean) ?? []);
    postalCodes = unique.size > 0 ? Array.from(unique) : [undefined];
  }

  // Determina tiendas
  const { data: stores } = await sb
    .from("stores")
    .select("id")
    .eq("active", true);
  const storeIds = (stores ?? [])
    .map((s) => s.id)
    .filter((id) => !storeFilter || id === storeFilter);

  const summary: Record<string, { ok: number; failed: number }> = {};

  for (const storeId of storeIds) {
    const scraper = SCRAPERS[storeId];
    if (!scraper) continue;

    for (const cp of postalCodes) {
      const { data: run } = await sb
        .from("scrape_runs")
        .insert({
          store_id: storeId,
          postal_code: cp ?? null,
          status: "running",
          products_total: PRODUCTS.length,
        })
        .select()
        .single();

      let ok = 0;
      let failed = 0;
      const inserts: Record<string, unknown>[] = [];

      for (const product of PRODUCTS) {
        try {
          const result = await scraper.fetchPrice(product, { postalCode: cp });
          if (result) {
            inserts.push({
              product_id: result.productId,
              store_id: result.storeId,
              postal_code: result.postalCode ?? null,
              price_mxn: result.priceMxn,
              price_per_unit: result.pricePerUnit ?? null,
              in_stock: result.inStock,
              promo_label: result.promoLabel ?? null,
              source_url: result.sourceUrl ?? null,
            });
            ok++;
          } else {
            failed++;
          }
          // Throttle suave: 400ms entre requests por tienda
          await new Promise((r) => setTimeout(r, 400));
        } catch (err) {
          console.error(`[${storeId}] ${product.id} error:`, err);
          failed++;
        }
      }

      if (inserts.length > 0) {
        await sb.from("price_snapshots").insert(inserts);
      }
      if (run?.id) {
        await sb
          .from("scrape_runs")
          .update({
            finished_at: new Date().toISOString(),
            status: failed === 0 ? "ok" : ok === 0 ? "failed" : "partial",
            products_ok: ok,
            products_failed: failed,
          })
          .eq("id", run.id);
      }

      summary[`${storeId}/${cp ?? "nacional"}`] = { ok, failed };
    }
  }

  return NextResponse.json({ summary });
}
