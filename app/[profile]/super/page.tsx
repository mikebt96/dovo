import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getShoppingFor, totalCost } from "@/lib/data/shopping";
import { folioSerial, isoWeek, pad } from "@/lib/dates";
import { getDietaryProfile } from "@/lib/profileServer";
import { getBestPrices, cheapestBasketTotal } from "@/lib/prices";
import CheckList from "@/app/components/CheckList";
import {
  Folio,
  Plate,
  Ticket,
  TicketHead,
  TicketFoot,
  LeaderRow,
  Stamp,
  Perforated,
} from "@/app/components/carnet";
import type { BestPriceResult, StoreId } from "@/lib/types";

const STORE_LABEL: Record<StoreId, string> = {
  walmart: "Walmart",
  soriana: "Soriana",
  chedraui: "Chedraui",
  sumesa: "Sumesa",
};

export default async function SuperPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  const items = getShoppingFor(profile.id);
  const myItems = items.filter((i) => i.user === profile.id);
  const sharedItems = items.filter((i) => i.user === "shared");
  const total = totalCost(items);
  const myTotal = totalCost(myItems);
  const sharedTotal = totalCost(sharedItems);

  const byStore = items.reduce<Record<string, typeof items>>((acc, item) => {
    acc[item.store] = acc[item.store] || [];
    acc[item.store].push(item);
    return acc;
  }, {});

  const accent =
    profile.id === "mike"
      ? "var(--color-plate-mike)"
      : "var(--color-plate-andy)";

  const week = pad(isoWeek(new Date()), 2);

  // Live prices: CP + best prices por productId (graceful fallback)
  const dietary = await getDietaryProfile(profile.id).catch(() => null);
  const cp = dietary?.postalCode;
  const productIds = items
    .map((i) => i.productId)
    .filter((x): x is string => !!x);
  const bestPrices = await getBestPrices(productIds, cp).catch(
    () => new Map<string, BestPriceResult>()
  );
  const haveLivePrices = bestPrices.size > 0;
  const cheapest = haveLivePrices
    ? cheapestBasketTotal(bestPrices)
    : null;
  const savings = cheapest ? Math.max(0, total - cheapest.total) : 0;

  return (
    <div className="space-y-10">
      <Folio
        serial={`LIST·W${week}·${profile.id.slice(0, 2).toUpperCase()}`}
        title="VALE DE COMPRA"
      />

      <section>
        <p className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-ink-mute)] mb-2">
          LISTA DE SÚPER · SEMANA {week}
          {cp && <span> · CP {cp}</span>}
        </p>
        <h1
          className="font-extrabold tracking-tight leading-[0.88]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
          }}
        >
          Tu compra de la semana.
        </h1>
        <p
          className="mt-4 italic text-[color:var(--color-ink-soft)] leading-relaxed max-w-xl"
          style={{ fontFamily: "var(--font-stamp)", fontSize: "1.05rem" }}
        >
          Lo que es tuyo, lo que es compartido. Marcas en pasillo, llegas a casa
          con la semana resuelta.
        </p>

        {!cp && (
          <p className="mt-4">
            <Link href={`/${profile.id}/preferences`}>
              <Stamp sm variant="warn">
                CONFIGURA TU CP EN PREFS
              </Stamp>
            </Link>
          </p>
        )}
      </section>

      <Perforated thick />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
        <LeaderRow
          label="Total semana (lista)"
          value={`$${total}`}
          accent="var(--color-overprint)"
        />
        {haveLivePrices && cheapest && (
          <LeaderRow
            label="Total más barato (live)"
            value={`$${cheapest.total}`}
            accent="var(--color-overprint)"
          />
        )}
        <LeaderRow
          label={`Tuyo · ${myItems.length} ítems`}
          value={`$${myTotal}`}
          accent={accent}
        />
        <LeaderRow
          label={`Compartido · ${sharedItems.length} ítems`}
          value={`$${sharedTotal}`}
        />
        <LeaderRow
          label="Productos totales"
          value={String(items.length)}
        />
        {haveLivePrices && savings > 0 && (
          <LeaderRow
            label="Ahorro comprando barato"
            value={`$${savings.toFixed(0)}`}
            accent={accent}
          />
        )}
      </section>

      <Perforated />

      {Object.entries(byStore).map(([store, storeItems]) => {
        const storeTotal = totalCost(storeItems);
        const checkItems = storeItems.map((it) => {
          const best = it.productId ? bestPrices.get(it.productId) : undefined;
          const showSavings = best && best.savingsVsWorst >= 5;
          const livePrice = best?.bestPriceMxn;

          return {
            id: it.id,
            primary: (
              <div>
                <p className="font-bold text-sm leading-tight">
                  {it.name}
                  {it.user !== "shared" && (
                    <span className="ml-2 inline-block align-middle">
                      <Plate who={it.user as "mike" | "andy"}>
                        {it.user === profile.id ? "tuyo" : it.user}
                      </Plate>
                    </span>
                  )}
                </p>
                {it.subtitle && (
                  <p className="text-xs text-[color:var(--color-ink-mute)] mt-0.5">
                    {it.subtitle}
                  </p>
                )}
                {best && (
                  <p className="mono text-[10px] text-[color:var(--color-ink-mute)] mt-1 tabular">
                    {best.allPrices
                      .map(
                        (p) =>
                          `${STORE_LABEL[p.storeId]} $${p.priceMxn.toFixed(0)}${
                            p.storeId === best.bestStore ? " ◀" : ""
                          }`
                      )
                      .join(" · ")}
                  </p>
                )}
              </div>
            ),
            meta: (
              <div className="text-right">
                <p
                  className="mono text-[10px] tabular"
                  style={{ color: "var(--color-overprint)" }}
                >
                  {it.qty}
                </p>
                <p className="mono text-[10px] tabular text-[color:var(--color-ink-mute)]">
                  ${livePrice?.toFixed(0) ?? it.priceMxn}
                  {!livePrice && " est."}
                </p>
                {showSavings && (
                  <span className="inline-block mt-1">
                    <Stamp sm>
                      -${best.savingsVsWorst.toFixed(0)} en{" "}
                      {STORE_LABEL[best.bestStore]}
                    </Stamp>
                  </span>
                )}
              </div>
            ),
          };
        });

        return (
          <Ticket key={store}>
            <TicketHead
              eyebrow={`SUCURSAL · ${storeItems.length} productos`}
              title={
                <span className="flex items-baseline gap-3">
                  <Stamp sm>{storeLabel(store)}</Stamp>
                </span>
              }
              right={
                <span className="mono text-[11px] tabular text-[color:var(--color-ink-soft)]">
                  ${storeTotal}
                </span>
              }
            />
            <CheckList
              storageKey={`super-${profile.id}-${store}`}
              items={checkItems}
              accent={accent}
            />
            <TicketFoot
              serial={`${store.toUpperCase()}·W${week}·${profile.id.toUpperCase()}`}
            />
          </Ticket>
        );
      })}

      <p className="mono text-[10px] tracking-widest text-[color:var(--color-ink-dim)] text-center">
        {haveLivePrices
          ? "precios live · scrapeado diariamente · cache 24h"
          : "precios estimados · corre el cron para sincronizar live"}
      </p>
    </div>
  );
}

function storeLabel(store: string): string {
  if (store === "walmart") return "Walmart";
  if (store === "vegetariana") return "Vegetariana";
  return store;
}
