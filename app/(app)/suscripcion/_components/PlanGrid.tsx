"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import UpgradeButton from "@/app/_components/UpgradeButton";
import type { Tier } from "@/lib/billing/tiers";
import type { BillingInterval } from "@/lib/stripe";

// Grid de planes con toggle mensual/anual (anual = default, palanca #1 del pricing-gtm).
// Reusa los bullets de features de `landing.pricing.*` para no duplicar copy.
export default function PlanGrid({
  currentTier,
  billingEnabled,
}: {
  currentTier: Tier;
  billingEnabled: boolean;
}) {
  const t = useTranslations("suscripcion");
  const tp = useTranslations("landing");
  const [interval, setInterval] = useState<BillingInterval>("year");
  const isYear = interval === "year";

  const proPrice = isYear ? t("pro.priceYear") : t("pro.priceMonth");
  const proPeriod = isYear ? t("pro.periodYear") : t("pro.periodMonth");
  const proPerCap = isYear ? t("pro.perCapYear") : t("pro.perCapMonth");
  const premPrice = isYear ? t("premium.priceYear") : t("premium.priceMonth");
  const premPeriod = isYear ? t("premium.periodYear") : t("premium.periodMonth");

  return (
    <div>
      {/* Toggle mensual / anual */}
      <div className="inline-flex items-center rounded-full border border-ink/15 p-1 mb-8 text-xs mono uppercase tracking-[0.14em]">
        <button
          type="button"
          onClick={() => setInterval("month")}
          aria-pressed={!isYear}
          className={`rounded-full px-4 py-2 transition-colors ${
            !isYear ? "bg-ink text-papel" : "opacity-60 hover:opacity-100"
          }`}
        >
          {t("intervalMonth")}
        </button>
        <button
          type="button"
          onClick={() => setInterval("year")}
          aria-pressed={isYear}
          className={`rounded-full px-4 py-2 transition-colors inline-flex items-center gap-2 ${
            isYear ? "bg-ink text-papel" : "opacity-60 hover:opacity-100"
          }`}
        >
          {t("intervalYear")}
          <span className={isYear ? "text-stat-vit" : "text-signal"}>
            {t("intervalYearHint")}
          </span>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 items-start">
        {/* FREE */}
        <PlanCard
          name={t("free.name")}
          price={t("free.price")}
          period={t("free.period")}
          features={[1, 2, 3, 4, 5, 6].map((i) => tp(`pricing.freeF${i}`))}
          cta={
            currentTier === "free" ? (
              <CurrentPill label={t("currentLabel")} />
            ) : (
              <span className="block text-center text-xs mono uppercase tracking-widest opacity-50 py-3">
                {t("free.included")}
              </span>
            )
          }
        />

        {/* PRO — featured */}
        <PlanCard
          featured
          tag={t("pro.tag")}
          name={t("pro.name")}
          price={proPrice}
          period={proPeriod}
          perCap={proPerCap}
          save={isYear ? t("pro.saveYear") : undefined}
          features={[1, 2, 3, 4, 5, 6].map((i) => tp(`pricing.proF${i}`))}
          cta={
            currentTier === "pro" ? (
              <CurrentPill label={t("currentLabel")} accent />
            ) : (
              <UpgradeButton
                tier="pro"
                interval={interval}
                billingEnabled={billingEnabled}
                label={t("pro.cta")}
                comingSoonLabel={t("comingSoon")}
                errorLabel={t("ctaError")}
                className="w-full bg-signal text-white hover:bg-[#5a37e0]"
              />
            )
          }
        />

        {/* PREMIUM */}
        <PlanCard
          tag={t("premium.tag")}
          name={t("premium.name")}
          price={premPrice}
          period={premPeriod}
          features={[1, 2, 3, 4, 5].map((i) => tp(`pricing.premiumF${i}`))}
          cta={
            currentTier === "premium" ? (
              <CurrentPill label={t("currentLabel")} />
            ) : (
              <UpgradeButton
                tier="premium"
                interval={interval}
                billingEnabled={billingEnabled}
                label={t("premium.cta")}
                comingSoonLabel={t("comingSoon")}
                errorLabel={t("ctaError")}
                className="w-full bg-ink text-papel hover:bg-signal hover:text-white"
              />
            )
          }
        />
      </div>

      <p className="text-[11px] mono uppercase tracking-[0.16em] opacity-70 mt-6 max-w-md leading-relaxed">
        {t("footnote")}
      </p>
    </div>
  );
}

function PlanCard({
  featured = false,
  tag,
  name,
  price,
  period,
  perCap,
  save,
  features,
  cta,
}: {
  featured?: boolean;
  tag?: string;
  name: string;
  price: string;
  period: string;
  perCap?: string;
  save?: string;
  features: string[];
  cta: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl p-6 ${
        featured
          ? "bg-white border border-signal/60"
          : "border border-ink/12 bg-papel"
      }`}
      style={
        featured
          ? { boxShadow: "0 24px 60px -30px rgba(109,74,255,0.55)" }
          : undefined
      }
    >
      <div className="text-[10px] mono uppercase tracking-[0.18em] mb-3 h-4 text-signal">
        {tag ?? " "}
      </div>
      <h3 className="display text-2xl font-bold lowercase">{name}</h3>
      <div className="flex items-baseline gap-2 mt-3">
        <span className="display text-4xl font-extrabold tabular-nums tracking-[-0.03em]">
          {price}
        </span>
        {perCap && (
          <span className="text-[11px] mono uppercase tracking-wider text-signal">
            {perCap}
          </span>
        )}
      </div>
      <div className="text-xs opacity-55 mt-1">{period}</div>
      {save && (
        <div className="mt-2 inline-block rounded-full bg-stat-vit/20 px-2.5 py-1 text-[10px] mono uppercase tracking-wider text-ink/70">
          {save}
        </div>
      )}
      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-signal shrink-0 mt-1.5 h-1 w-1 rounded-full bg-signal" />
            <span className="opacity-80">{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">{cta}</div>
    </div>
  );
}

function CurrentPill({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`block text-center rounded-full px-6 py-3 text-sm mono uppercase tracking-[0.14em] ${
        accent
          ? "border border-signal/50 bg-signal/[0.15] text-signal"
          : "border border-ink/15 opacity-60"
      }`}
    >
      ✓ {label}
    </span>
  );
}
