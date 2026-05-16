import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getShoppingFor, totalCost, CATEGORY_ORDER } from "@/lib/data/shopping";
import { isoWeek, mondayOf, pad } from "@/lib/dates";
import { getDietaryProfile } from "@/lib/profileServer";
import { getBestPrices, cheapestBasketTotal } from "@/lib/prices";
import { getShoppingChecked, asRecord } from "@/lib/checksServer";
import { toggleCheck } from "@/lib/actions/checks";
import CheckList from "@/app/components/CheckList";
import {
  BigStat,
  BracketLink,
  Eyebrow,
  HRule,
  RoleDot,
  SectionLabel,
} from "@/app/components/ui";
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

  const week_start = mondayOf();
  const initialChecked = asRecord(
    await getShoppingChecked(profile.id, week_start),
  );

  async function handleToggle(id: string, checked: boolean) {
    "use server";
    return toggleCheck({
      table: "shopping_check",
      profile: profile!.id,
      key: id,
      week_start,
      checked,
    });
  }

  const items = getShoppingFor(profile.id);
  const myItems = items.filter((i) => i.user === profile.id);
  const sharedItems = items.filter((i) => i.user === "shared");
  const total = totalCost(items);
  const myTotal = totalCost(myItems);
  const sharedTotal = totalCost(sharedItems);

  const byCategory = items.reduce<Record<string, typeof items>>((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});
  const sortedCategories = Object.keys(byCategory).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const accent =
    profile.id === "mike"
      ? "var(--color-role-mike)"
      : "var(--color-role-andy)";

  const week = pad(isoWeek(new Date()), 2);

  const dietary = await getDietaryProfile(profile.id).catch(() => null);
  const cp = dietary?.postalCode;
  const productIds = items
    .map((i) => i.productId)
    .filter((x): x is string => !!x);
  const bestPrices = await getBestPrices(productIds, cp).catch(
    () => new Map<string, BestPriceResult>()
  );
  const haveLivePrices = bestPrices.size > 0;
  const cheapest = haveLivePrices ? cheapestBasketTotal(bestPrices) : null;
  const savings = cheapest ? Math.max(0, total - cheapest.total) : 0;

  return (
    <div className="space-y-12 pb-20">
      <section className="pt-4">
        <Eyebrow className="mb-3">
          <RoleDot who={profile.id} />
          <span>{profile.displayName.toLowerCase()}</span>
          <span className="text-[color:var(--color-text-4)]">·</span>
          <span>Semana {week}</span>
          {cp && (
            <>
              <span className="text-[color:var(--color-text-4)]">·</span>
              <span>CP {cp}</span>
            </>
          )}
        </Eyebrow>
        <h1
          className="font-extrabold lowercase tracking-tight leading-[0.85]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3rem, 9vw, 5.5rem)",
            color: "var(--color-text)",
            letterSpacing: "-0.04em",
          }}
        >
          compras.
        </h1>
        <p
          className="mt-4 text-[color:var(--color-text-2)] leading-relaxed max-w-xl"
          style={{ fontSize: "1.05rem" }}
        >
          Tu lista filtrada de la semana. Marca en pasillo y llega a casa con
          todo resuelto.
        </p>
        {!cp && (
          <div className="mt-5">
            <BracketLink href={`/${profile.id}/preferences`}>
              Agregar tu CP para precios reales →
            </BracketLink>
          </div>
        )}
      </section>

      <HRule />

      {/* Totals */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
        <BigStat label="Total semana" value={`$${total}`} sub="estimado" accent="var(--color-accent)" />
        {haveLivePrices && cheapest && (
          <BigStat label="Más barato (live)" value={`$${cheapest.total}`} sub={savings > 0 ? `ahorras $${savings.toFixed(0)}` : "ya está al mínimo"} accent="var(--color-success)" />
        )}
        <BigStat label="Tuyo" value={`$${myTotal}`} sub={`${myItems.length} ítems`} accent={accent} />
        <BigStat label="Compartido" value={`$${sharedTotal}`} sub={`${sharedItems.length} ítems`} />
      </section>

      <HRule />

      {/* Per-category lists */}
      <div className="space-y-12">
        {sortedCategories.map((category) => {
          const catItems = byCategory[category];
          const catTotal = totalCost(catItems);

          const checkItems = catItems.map((it) => {
            const best = it.productId ? bestPrices.get(it.productId) : undefined;
            const showSavings = best && best.savingsVsWorst >= 5;
            const livePrice = best?.bestPriceMxn;

            return {
              id: it.id,
              primary: (
                <div>
                  <p className="font-bold text-sm leading-tight flex items-center gap-2">
                    <span>{it.name}</span>
                    {it.user !== "shared" && (
                      <RoleDot who={it.user as "mike" | "andy"} className="!w-1.5 !h-1.5" />
                    )}
                  </p>
                  {it.subtitle && (
                    <p className="text-xs text-[color:var(--color-text-3)] mt-0.5">
                      {it.subtitle}
                    </p>
                  )}
                  {best && (
                    <p className="mono text-[10px] text-[color:var(--color-text-3)] mt-1 tabular">
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
                    style={{ color: "var(--color-accent)" }}
                  >
                    {it.qty}
                  </p>
                  <p className="mono text-[10px] tabular text-[color:var(--color-text-3)]">
                    ${livePrice?.toFixed(0) ?? it.priceMxn}
                    {!livePrice && " est."}
                  </p>
                  {showSavings && (
                    <p
                      className="mono text-[9px] tracking-widest uppercase mt-1"
                      style={{ color: "var(--color-success)" }}
                    >
                      -${best.savingsVsWorst.toFixed(0)} {STORE_LABEL[best.bestStore]}
                    </p>
                  )}
                </div>
              ),
            };
          });

          return (
            <section key={category}>
              <SectionLabel right={`$${catTotal}`}>
                {category}
                <span className="ml-3 mono text-[10px] tracking-widest text-[color:var(--color-text-3)]">
                  {catItems.length}
                </span>
              </SectionLabel>
              <div className="mt-2">
                <CheckList
                  storageKey={`super-${profile.id}-${week_start}-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  items={checkItems}
                  accent={accent}
                  initialChecked={initialChecked}
                  onToggle={handleToggle}
                />
              </div>
            </section>
          );
        })}
      </div>

      <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] text-center mt-8">
        {haveLivePrices
          ? "precios live · scrapeado diario · cache 24h"
          : "precios estimados · corre el cron para sincronizar live"}
      </p>
    </div>
  );
}
