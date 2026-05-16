import { NextResponse } from "next/server";
import { PRODUCTS, getProduct } from "@/lib/data/products";
import { SCRAPERS } from "@/lib/scrapers";
import { SCRAPER_TIMEOUT_MS, SCRAPER_UA } from "@/lib/scrapers/base";
import type { StoreId } from "@/lib/types";

/**
 * Dev tool: probar un scraper sin escribir a DB.
 *
 * GET /api/admin/scrape-test?store=walmart&productId=huevo-18
 * GET /api/admin/scrape-test?store=soriana&query=tofu&cp=06600
 * GET /api/admin/scrape-test?store=chedraui&probeAll=true   ← itera 28 productos
 *
 * Auth: header `Authorization: Bearer $CRON_SECRET`.
 * Throttle: 400ms entre productos (mismo que el cron real).
 *
 * Útil para tunear regex de html-generic.ts cuando algún DOM cambia.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("store") as StoreId | null;
  const productId = searchParams.get("productId");
  const queryOverride = searchParams.get("query") ?? undefined;
  const cp = searchParams.get("cp") ?? undefined;
  const probeAll = searchParams.get("probeAll") === "true";

  if (!storeId || !SCRAPERS[storeId]) {
    return NextResponse.json(
      {
        error: "missing or invalid store",
        validStores: Object.keys(SCRAPERS),
      },
      { status: 400 }
    );
  }
  const scraper = SCRAPERS[storeId];

  // Modo 1: probeAll — itera todos los productos, devuelve summary
  if (probeAll) {
    const results: Array<{
      productId: string;
      canonicalName: string;
      found: boolean;
      priceMxn?: number;
      matchedName?: string;
    }> = [];
    let ok = 0;
    let failed = 0;
    for (const p of PRODUCTS) {
      try {
        const r = await scraper.fetchPrice(p, { postalCode: cp });
        if (r) {
          ok++;
          results.push({
            productId: p.id,
            canonicalName: p.canonicalName,
            found: true,
            priceMxn: r.priceMxn,
            matchedName: r.matchedName,
          });
        } else {
          failed++;
          results.push({
            productId: p.id,
            canonicalName: p.canonicalName,
            found: false,
          });
        }
      } catch (err) {
        failed++;
        results.push({
          productId: p.id,
          canonicalName: p.canonicalName,
          found: false,
        });
        console.warn(`[probeAll] ${p.id}:`, err);
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    return NextResponse.json({
      store: storeId,
      postalCode: cp ?? null,
      total: PRODUCTS.length,
      ok,
      failed,
      successRate: `${Math.round((ok / PRODUCTS.length) * 100)}%`,
      results,
    });
  }

  // Modo 2: single product
  if (!productId && !queryOverride) {
    return NextResponse.json(
      {
        error: "pass productId or query (or probeAll=true)",
        availableProductIds: PRODUCTS.map((p) => p.id),
      },
      { status: 400 }
    );
  }

  const product = productId
    ? getProduct(productId)
    : ({
        id: "ad-hoc",
        canonicalName: queryOverride!,
        category: "ad-hoc",
        unit: "piezas" as const,
        unitQty: 1,
        tags: [],
        isVegetarian: true,
        isVegan: false,
        containsDairy: false,
        containsEggs: false,
        containsGluten: false,
      });

  if (!product) {
    return NextResponse.json(
      { error: `product not found: ${productId}` },
      { status: 404 }
    );
  }

  const startedAt = Date.now();
  let result;
  try {
    result = await scraper.fetchPrice(product, {
      postalCode: cp,
      queryOverride,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "scraper threw", detail: String(err) },
      { status: 502 }
    );
  }
  const elapsedMs = Date.now() - startedAt;

  // Extra: para scrapers HTML, traer un excerpt del HTML para diagnóstico
  // Solo si no es Walmart (que usa API) y solo si el match falló.
  let htmlExcerpt: string | undefined;
  let probedUrl: string | undefined;
  if (storeId !== "walmart" && !result) {
    const q = queryOverride ?? product.canonicalName;
    probedUrl = buildHtmlProbeUrl(storeId, q);
    if (probedUrl) {
      try {
        const res = await fetch(probedUrl, {
          headers: { "User-Agent": SCRAPER_UA, "Accept-Language": "es-MX,es;q=0.9" },
          signal: AbortSignal.timeout(SCRAPER_TIMEOUT_MS),
        });
        const text = await res.text();
        htmlExcerpt = text.slice(0, 5_000);
      } catch (err) {
        htmlExcerpt = `fetch failed: ${String(err)}`;
      }
    }
  }

  return NextResponse.json({
    store: storeId,
    product: {
      id: product.id,
      canonicalName: product.canonicalName,
      unit: `${product.unitQty} ${product.unit}`,
    },
    query: queryOverride ?? product.canonicalName,
    postalCode: cp ?? null,
    elapsedMs,
    found: !!result,
    result,
    probedUrl,
    htmlExcerpt,
  });
}

function buildHtmlProbeUrl(store: StoreId, q: string): string | undefined {
  if (store === "soriana")
    return `https://www.soriana.com/buscador?Ntt=${encodeURIComponent(q)}`;
  if (store === "chedraui")
    return `https://www.chedraui.com.mx/${encodeURIComponent(
      q.replaceAll(" ", "-")
    )}?_q=${encodeURIComponent(q)}`;
  if (store === "sumesa")
    return `https://www.sumesa.com.mx/${encodeURIComponent(
      q.replaceAll(" ", "-")
    )}?_q=${encodeURIComponent(q)}`;
  return undefined;
}
